/*
 * Name: KV Le
 * Date: April 15, 2020
 * Section: CSE 154 AN
 *
 * This is the JS file that initiates and manages the Pokedex displayed
 * on the main index.html page. A Pokedex is a  tool that displays information
 * on various types of creatures found in the game Pokemon. All data given is
 * retrieved from the PokeAPI which can be found here: https://pokeapi.co/
 */

"use strict";

(function() {
  window.addEventListener("load", init);
  const BASE_URL = "https://pokeapi.co/api/v2/";
  const LOADING_GIF_LINK = "https://66.media.tumblr.com/c99a579db3ae0fc164bf4cca148885d3/" +
    "tumblr_mjgv8kEuMg1s87n79o1_400.gif";
  const INDEX_OF_POKEAPI_ID = 6;
  const MAX_ID_IN_POKEAPI = 807;
  const DM_IN_M = 10;
  const HG_IN_KG = 10;
  const NOTIFICATION_TIME = 5000;
  let currentAccountInfo;
  let currentPokemon;

  /**
   * Initializes the page as it loads. (Gives base functionality)
   */
  function init() {
    buttonSetup();
  }

  /**
   * Logs a user into their accoutn with a given username and password
   */
  async function login() {
    let loginData = new FormData(id("account"));
    let loginResponse = await fetch("/login", {method: "POST", body: loginData});
    try {
      let loginMessage = await checkStatus(loginResponse).text();
      currentAccountInfo = [loginData.get("username"), loginData.get("password")];
      popUp(loginMessage);
      addFavoriteButton();
      qs("header h2").textContent = `Currently Logged in: ${currentAccountInfo[0]}`;
      await updateFavorites();
      qs("input[type='button'][value='Toggle Favorites']").removeAttribute("disabled");
    } catch (error) {
      popUp(currentAccountInfo ? "Failed to Login. Using Last Known Account" :
        "Server Error Occured. Please Try Again");
      if (currentAccountInfo) {
        id("username").value = currentAccountInfo[0];
        id("password").value = currentAccountInfo[1];
      }
    }
  }

  /**
   * Adds the current pokemon to the user's favorites list
   */
  async function addFavorite() {
    let params = new FormData();
    params.append("username", currentAccountInfo[0]);
    params.append("password", currentAccountInfo[1]);
    params.append("pokemon", currentPokemon);
    try {
      let response = await fetch("/favorites/add", {method: "PUT", body: params});
      response = await checkStatus(response).text();
      popUp(response);
    } catch (error) {
      popUp("Error has occured");
    }
    qs("#gallery input[type='button']").classList.add("hidden");
    updateFavorites();
  }

  /**
   * Updates the favorites box to contain a user's favorite pokemon
   */
  async function updateFavorites() {
    let params = new FormData();
    params.append("username", currentAccountInfo[0]);
    params.append("password", currentAccountInfo[1]);
    try {
      let favorites = await fetch("/favorites", {method: "POST", body: params});
      favorites = await checkStatus(favorites).json();
      id("favorites").innerHTML = "";
      for (let favorite of favorites) {
        favorite = favorite.split(",");
        let spriteURL = await getSpriteMisc(favorite[1], "pokemon/");
        spriteURL = spriteURL || "missingno.png";

        let figure = gen("figure");
        let figureCaption = gen("figcaption", capitalize(favorite[0]));
        let sprite = gen("img");
        sprite.src = spriteURL;
        sprite.alt = favorite[0];

        figure.appendChild(sprite);
        figure.appendChild(figureCaption);
        id("favorites").appendChild(figure);
      }
    } catch (error) {
      popUp("Can't update favorites");
    }
    addFavoriteListeners();
  }

  /**
   * Adds listeners for the favorite pokemon
   */
  function addFavoriteListeners() {
    Array.from(id("favorites").children).forEach(evolution => {
      evolution.addEventListener("click", () => {
        getNewPokemon(evolution.children[1].textContent.toLowerCase());
        window.scrollTo(0, 0);
        qs("input[type='button'][value='Toggle Favorites']").click();
      });
    });
  }

  /**
   * Retrieves all the needed data for a Pokemon from the PokeAPI
   * @param {string|Number} identifier - The identification used to retrieve the
   * Pokemon data from PokeAPI. PokeAPI accepts both the Pokemon name and ID
   * @return {object} Returns an object that contains all the relavent information
   * about the pokemon for this Pokedex to function
   */
  async function getPokeData(identifier) {
    let pokemon = {};

    await setSpeciesData(pokemon, identifier);
    await setPokeData(pokemon);
    await setEvoData(pokemon);

    return pokemon;
  }

  /**
   * Helper function to retrieve and set Pokemon data about the species
   * @param {object} pokemon - Object that contains current Pokemon's data
   * @param {string|Number} identifier - The identification used to retrieve the
   * Pokemon data from PokeAPI. PokeAPI accepts both the Pokemon name and ID
   */
  async function setSpeciesData(pokemon, identifier) {
    let speciesDataResponse = await fetch(`${BASE_URL}pokemon-species/${identifier}`);
    let speciesData = await checkStatus(speciesDataResponse).json();
    pokemon.name = speciesData.name;
    pokemon.flavorText = getFirstOfData(speciesData.flavor_text_entries, "flavor_text");
    pokemon.color = speciesData.color.name;
    pokemon.evoChainURL = speciesData.evolution_chain.url;
    pokemon.habitat = speciesData.habitat ? speciesData.habitat.name : "N/A";
    pokemon.varieties = speciesData.varieties.map(variety => variety.pokemon.name);
    pokemon.varietiesRaw = speciesData.varieties;
    pokemon.growthRate = speciesData.growth_rate.name;
    pokemon.genus = getFirstOfData(speciesData.genera, "genus");
    pokemon.generation = speciesData.generation.name;
    pokemon.allNames =
      speciesData.names.map(name => `${name.language.name.toUpperCase()}: ${name.name}`);
  }

  /**
   * Helper function to retrieve and set a Pokemon's general data
   * @param {object} pokemon - Object that contains current Pokemon's data
   */
  async function setPokeData(pokemon) {
    let pokeDataResponse =
      await fetch(`${BASE_URL}pokemon/${getFirstValidVarietyName(pokemon.varietiesRaw)}`);
    let pokeData = await checkStatus(pokeDataResponse).json();
    pokemon.id = pokeData.id;
    pokemon.sprite = pokeData.sprites.front_default || "missingno.png";
    pokemon.types = pokeData.types.map(type => capitalize(type.type.name));
    pokemon.abilities = pokeData.abilities.map(ability => capitalize(ability.ability.name));
    pokemon.games = pokeData.game_indices.map(version => capitalize(version.version.name));
    pokemon.naturalMoves = pokeData.moves.map(move => capitalize(move.move.name));
    pokemon.height = pokeData.height;
    pokemon.forms = pokeData.forms.map(form => form.name);
    pokemon.weight = pokeData.weight;
    pokemon.stats = pokeData.stats.map(stat => `Base ${capitalize(stat.stat.name)}: ` +
      `${stat.base_stat} points`);
  }

  /**
   * Helper function to retrieve and set a Pokemon's evolution data
   * @param {object} pokemon - Object that contains current Pokemon's data
   */
  async function setEvoData(pokemon) {
    let evoDataResponse = await fetch(pokemon.evoChainURL);
    let evoData = await checkStatus(evoDataResponse).json();
    pokemon.evolutions = getEvolutions(evoData.chain);
  }

  /**
   * Retrieves the default sprite type for a given Pokemon identifier
   * @param {string|Number} identifier - The identification used to retrieve the
   * Pokemon data from PokeAPI. PokeAPI accepts both the Pokemon name and ID
   * @param {string} [requestType="pokemon/"] - Type of API request needed to send
   * to the PokeAPI to get the right sprite information
   * @return {string} Returns the URL of the sprite that matches the given
   * parameters
   */
  async function getSpriteMisc(identifier, requestType = "pokemon/") {
    let response = await fetch(`${BASE_URL}${requestType}${identifier}`);
    let data = await checkStatus(response).json();
    return data.sprites.front_default;
  }

  /**
   * Retrieves a Pokemon data and displays it onto the Pokedex on index.html
   * @param {string|Number} identifier - The identification used to retrieve the
   * Pokemon data from PokeAPI. PokeAPI accepts both the Pokemon name and ID
   * @description If a pokemon doesn't exist or cannot be retrieved, a user friendly
   * message will appear on the Pokedex.
   */
  async function getNewPokemon(identifier) {
    currentPokemon = null;
    disableInput();
    removeInfo();
    qs("#gallery input[type='button']").classList.add("hidden");
    if (typeof (identifier) === "string" && identifier.includes("cutest")) {
      identifier = "pichu";
    }
    try {
      let pokemon = await getPokeData(identifier);
      addInfo(pokemon);
      await addExtraInfo(pokemon.forms, "form", "forms", "pokemon-form/");
      await addExtraInfo(pokemon.varieties, "variety", "varieties", "pokemon/");
      await addEvolutions(pokemon.evolutions);
      qs("input[type='button'][value='Back']").removeAttribute("disabled");
      qs("input[type='button'][value='Next']").removeAttribute("disabled");
      currentPokemon = [pokemon.name, pokemon.id];
    } catch (error) {
      removeInfo("Sorry it seems like the Pokemon you entered doesn't exist");
    }
    try {
      addFavoriteButton();
    } catch (error) {
      popUp("There was a button toggling error, hopefully this never happens though");
    }
    enableInput();
  }

  /**
   * Redisplays the button to add Favorites
   */
  async function addFavoriteButton() {
    if (currentAccountInfo && currentPokemon) {
      let params = new FormData();
      params.append("username", currentAccountInfo[0]);
      params.append("password", currentAccountInfo[1]);
      params.append("pokemon", currentPokemon);
      let response = await fetch("/check", {method: "POST", body: params});
      response = await response.text();
      if (response === "false") {
        qs("#gallery input[type='button']").classList.remove("hidden");
      }
    }
  }

  /**
   * Removes all the info that is displayed on the Pokedex and displays a message
   * @param {string} [message="Loading..."] - The message that will be displayed
   * once all the information is removed
   */
  function removeInfo(message = "Loading...") {
    let infoItems = Array.from(id("general").children);
    infoItems.forEach(item => {
      id("general").removeChild(item);
    });
    let newMessage = gen("p", message);
    id("general").appendChild(newMessage);
    id("sprite").src = LOADING_GIF_LINK;
    id("sprite").alt = "Running Pikachu";
    qs("input[type='button'][value='Back']").setAttribute("disabled", true);
    qs("input[type='button'][value='Next']").setAttribute("disabled", true);
    id("evolutions").innerHTML = "";
    id("varieties").innerHTML = "";
    id("forms").innerHTML = "";
  }

  /**
   * Adds general information about the Pokemon to the Pokedex display
   * @param {object} pokemon - A Pokemon object that contains all the relevant
   * information about it
   */
  function addInfo(pokemon) {
    id("general").innerHTML = "";
    id("sprite").src = pokemon.sprite;
    id("sprite").alt = pokemon.name;

    let newItems = [
      gen("p", `#${pokemon.id}, ${capitalize(pokemon.name)}`),
      gen("p", `The ${pokemon.genus}`),
      gen("p", `Introduced in ${capitalize(pokemon.generation)}`),
      gen("p", `Flavor Text: ${pokemon.flavorText}`),
      gen("p", `Type(s): ${pokemon.types.join(", ")}`),
      gen("p", `Abilities: ${pokemon.abilities.join(", ")}`),
      gen("p", `Height: ${pokemon.height / DM_IN_M} m, ` +
        `Weight: ${pokemon.weight / HG_IN_KG} kg, ` +
        `XP Growth: ${capitalize(pokemon.growthRate)}`),
      gen("p", `Habitat: ${capitalize(pokemon.habitat)}`),
      gen("p", `Color: ${capitalize(pokemon.color)}`),
      genFullDetails("Stats", pokemon.stats.join(", ")),
      genFullDetails("Game Appearances", pokemon.games.join(", ")),
      genFullDetails("Naturally Learned Moves", pokemon.naturalMoves.join(", ")),
      genFullDetails("All Names", pokemon.allNames.join(", "))
    ];

    newItems.forEach(item => {
      id("general").appendChild(item);
    });
  }

  /**
   * Generates a new details HTML object that has it's summary element and content filled out
   * @param {string} title - The title that the summary will display within the detail
   * @param {string} content - The text content that the detail will contain
   * @return {element} Returns a newly generated details HTML element that is fully filled
   */
  function genFullDetails(title, content) {
    let detail = gen("details");
    detail.appendChild(gen("summary", title));
    detail.appendChild(gen("p", content));
    return detail;
  }

  /**
   * Adds extra information about the Pokemon to the Pokedex display (Usually about
   * form or variety)
   * @param {Array} data - An array of data that is needed to be displayed on the
   * Pokedex. (Current data used is about form or variety)
   * @param {string} typeSingular - Singular form label of the data needed to be parsed
   * @param {string} typePlural - Plural form label of the data needed to be parsed
   * @param {string} requestType - API request type
   */
  async function addExtraInfo(data, typeSingular, typePlural, requestType) {
    if (data.length > 1) {
      for (let i = 0; i < data.length; i++) {
        let part = data[i];
        let spriteURL = await getSpriteMisc(part, requestType);
        spriteURL = spriteURL || "missingno.png";

        let figure = gen("figure", `${capitalize(typeSingular)} ${i + 1}: ${capitalize(part)}`);
        let figureCaption = gen("figcaption");
        let sprite = gen("img");
        sprite.src = spriteURL;
        sprite.alt = part;

        figure.appendChild(sprite);
        figure.appendChild(figureCaption);
        figure.addEventListener("click", () => {
          id("sprite").src = spriteURL;
          id("sprite").alt = "Missingno Glitch";
          window.scrollTo(0, 0);
        });
        id(typePlural).appendChild(figure);
      }
    }
  }

  /**
   * Adds extra information about the Pokemon's evolutionary stages to the Pokedex
   * @param {Array} evolutions - An array of Pokemon evolutionary stages that are
   * stored in the format of [Evolution Name, Stage Number]
   */
  async function addEvolutions(evolutions) {
    for (let i = 0; i < evolutions.length; i++) {
      let evolution = evolutions[i];
      let pokemon = await getPokeData(evolution[0].toLowerCase());

      let figure = gen("figure");
      let figureCaption = gen("figcaption", `Stage ${evolution[1]}: ${capitalize(pokemon.name)}`);
      let sprite = gen("img");
      sprite.src = pokemon.sprite;
      sprite.alt = pokemon.name;

      figure.appendChild(sprite);
      figure.appendChild(figureCaption);
      id("evolutions").appendChild(figure);
    }

    /**
     * I didn't add listeners in the loop because that would have allowed a user to click and
     * load a new Pokemon while one was already loading
     */
    Array.from(id("evolutions").children).forEach(evolution => {
      evolution.addEventListener("click", () => {
        getNewPokemon(evolution.children[1].textContent.split(" ")[2].toLowerCase());
        window.scrollTo(0, 0);
      });
    });
  }

  /**
   * Parses the array directly retrieved from PokeAPI about evolutions and returns
   * a list of the evolutionary stages in a readable format
   * @param {array} evChain - The arrray of evolutions directly retrieved from the
   * PokeAPI website
   * @return {array} An array of Pokemon evolutionary stages that are stored in
   * the format of [Evolution Name, Stage Number]
   */
  function getEvolutions(evChain) {
    return getEvolutionsHelper(evChain, [], 1);
  }

  /**
   * Recursive helper for the getEvolutions function.
   * @param {array} evChain - The array of evolutions directly retrieved from the
   * PokeAPI website
   * @param {array} current - The currently built array of Pokemon evolutionary
   * stages that are stored in the format of [Evolution Name, Stage Number]
   * @param {Number} stage - The current stage number the function is on
   * @return {array} The recently updated array of Pokemon evolutionary stages that
   * are stored in the format of [Evolution Name, Stage Number]
   */
  function getEvolutionsHelper(evChain, current, stage) {
    current.push([evChain.species.name, stage]);
    for (let evChainNext of evChain.evolves_to) {
      current.concat(getEvolutionsHelper(evChainNext, current, stage + 1));
    }
    return current;
  }

  /**
   * Retrieves the first piece of data that matches the given langauge directly
   * retrieved from the PokeAPI website
   * @param {array} data - The array of data directly retrieved from the
   * PokeAPI website
   * @param {string} dataType - The type of data contained within the data array
   * @param {string} language - The desired langauge for the data retrieved
   * @return {string} Returns a string that represents the first piece of valide
   * data that was mean to be retrieved
   */
  function getFirstOfData(data, dataType, language = "en") {
    for (let i = 0; i < data.length; i++) {
      if (data[i]["language"].name === language) {
        return data[i][dataType];
      }
    }
  }

  /**
   * Retrieves the first Variety name that is tied to a valid ID that can be used
   * by the Pokedex
   * @param {array} varieties - An array of varieties that contains all the variety
   * names and links
   * @return {string|null} Returns first valid variety name with a proper ID but
   * null if none are found
   * @description This function was implemented to work around how weirdly PokeAPI
   * organizes some of its stuff
   */
  function getFirstValidVarietyName(varieties) {
    for (let variety of varieties) {
      if (parseInt(variety.pokemon.url.split("/")[INDEX_OF_POKEAPI_ID]) <= MAX_ID_IN_POKEAPI) {
        return variety.pokemon.name;
      }
    }
    return null;
  }

  /**
   * Sets up buttons for the pokedex to work. (Adds listeners for the buttons)
   */
  function buttonSetup() {
    setupAudio();
    qs("input[type='button'][value='Back']").setAttribute("disabled", true);
    qs("input[type='button'][value='Next']").setAttribute("disabled", true);
    qs("input[type='text']").addEventListener("keydown", event => {
      if (event.key === "Enter") {
        qs("input[type='submit']").click();
      }
    });
    qsa("form")[0].addEventListener("submit", event => {
      event.preventDefault();
      getNewPokemon(conversion(id("selector").value));
    });
    qsa("form")[1].addEventListener("submit", event => {
      event.preventDefault();
      login();
    });
    qs("#gallery input[type='button']").addEventListener("click", addFavorite);
    qs("input[type='button'][value='Toggle Favorites']").addEventListener("click", () => {
      id("favorites").classList.toggle("hidden");
    });
    getPokemonButtons();
  }

  /**
   * Adds listeners to the buttons that retrieve pokemon
   */
  function getPokemonButtons() {
    qs("input[type='button'][value='Random!']").addEventListener("click", () => {
      getNewPokemon(Math.ceil(Math.random() * MAX_ID_IN_POKEAPI));
    });
    qs("input[type='button'][value='Back']").addEventListener("click", () => {
      let identity = id("general").children[0].textContent;
      getNewPokemon(parseInt(identity.substr(1, identity.indexOf(","))) - 1);
    });
    qs("input[type='button'][value='Next']").addEventListener("click", () => {
      let identity = id("general").children[0].textContent;
      getNewPokemon(parseInt(identity.substr(1, identity.indexOf(","))) + 1);
    });
  }

  /**
   * Displays a popup message that lasts for a couple seconds
   * @param {String} message - The message that will popup
   */
  function popUp(message) {
    qs("aside").appendChild(gen("p", capitalize(message, true)));
    setTimeout(() => {
      qs("aside").removeChild(qs("aside").children[0]);
    }, NOTIFICATION_TIME);
  }

  /**
   * Sets up audio and enables it to be toggled
   */
  function setupAudio() {
    let audio = new Audio("pokemusic.ogg");
    audio.volume = 0.15;
    qs("button").addEventListener("click", () => {
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    });
  }

  /**
   * Enables most input to the retrieve a new pokemon
   */
  function enableInput() {
    qs("input[type='text']").removeAttribute("disabled");
    qs("input[type='submit'][value='Get Pokemon']").disabled = false;
    qs("input[type='button'][value='Random!']").removeAttribute("disabled");
  }

  /**
   * Disables most input to the retrieve a new pokemon
   */
  function disableInput() {
    qs("input[type='text']").setAttribute("disabled", true);
    qs("input[type='submit'][value='Get Pokemon']").setAttribute("disabled", true);
    qs("input[type='button'][value='Random!']").setAttribute("disabled", true);
  }

  // Below are simple shortcut Functions

  /**
   * Capitalizes certain words of a given string
   * @param {string} str - String that will be capitalized
   * @param {boolean} [all=false] - boolean on whether every word or just the first
   * word is capitalized
   * @return {string} Returns a capitalized version of the given string
   */
  function capitalize(str, all = false) {
    if (all) {
      let words = str.split(" ");
      for (let i = 0; i < words.length; i++) {
        words[i] = words[i][0].toUpperCase() + words[i].substr(1);
      }
      return words.join(" ");
    }
    return str.charAt(0).toUpperCase() + str.substr(1);
  }

  /**
   * Converts an the given string to a valid integer or a all lowercased string
   * @param {string} value - The value that will be converted to the right format
   * to request a new pokemon
   * @return {Number|string} Returns an Integer if the value can be parsed into one
   * but returns the given string lowercased if it cannot be converted to an Integer
   */
  function conversion(value) {
    return parseInt(value) || value.toLowerCase().replace(" ", "");
  }

  /**
   * Checks a given response if it is valid or not. Throws an error if its not valid
   * @param {response} response - Reponse that will be checked if it can be successfully
   * used
   * @return {response} Returns given response if the response has successfully responded
   * with an "ok" code (200)
   */
  function checkStatus(response) {
    if (response.ok) {
      return response;
    }
    throw Error("Error in request: " + response.statusText);
  }

  /**
   * Shortcut for getElementById
   * @param {string} idName - The Id desired to retrieve
   * @return {element} Returns the HTML element with the given ID
   */
  function id(idName) {
    return document.getElementById(idName);
  }

  /**
   * Shortcut for querySelector
   * @param {string} selector - The selector desired to retrieve
   * @return {element} Returns the first HTML element that matches the selector
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * Shortcut for querySelectorAll
   * @param {string} selector - The selector desired to retrieve
   * @return {NodeList} Returns HTML elements that matches the selector
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }

  /**
   * Shortcut for createElement
   * @param {string} elType - The desired HTML type to generate
   * @param {string} [message=""] - Message that can automatically be set to the
   * elements textContent
   * @return {element} Returns a newly generated HTML element of the given type
   */
  function gen(elType, message = "") {
    if (message.length !== 0) {
      let newElement = document.createElement(elType);
      newElement.textContent = message;
      return newElement;
    }
    return document.createElement(elType);
  }
})();