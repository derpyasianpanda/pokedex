"use strict";

const express = require("express");
const app = express();
const multer = require("multer");
const fs = require("fs").promises;

app.use(multer().none());

/**
 * Sends a given user's favorites list
 */
app.post("/favorites", async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  if (!(username && password)) {
    res.type("text");
    res.status(400).send("Bad Request: Missing Parameters");
  } else {
    try {
      let accounts = JSON.parse(await fs.readFile("accounts.json", "utf8"));
      let identifier = `${username}, ${password}`;
      if (accounts[identifier]) {
        res.status(200).json(accounts[identifier]);
      } else {
        res.type("text");
        res.status(400).send("User doesn't exist!");
      }
    } catch (err) {
      res.type("text");
      res.status(500).send("Server error has occured");
    }
  }
});

/**
 * Checks if a given pokemon is in a user's favorites list
 */
app.post("/check", async (req, res) => {
  res.type("text");
  let username = req.body.username;
  let password = req.body.password;
  let pokemon = req.body.pokemon;
  if (!(username && password)) {
    res.status(400).send("Bad Request: Missing Parameters");
  } else {
    try {
      let accounts = JSON.parse(await fs.readFile("accounts.json", "utf8"));
      let identifier = `${username}, ${password}`;
      if (accounts[identifier]) {
        res.status(200).send(accounts[identifier].includes(pokemon));
      } else {
        res.status(400).send("User doesn't exist!");
      }
    } catch (err) {
      res.status(500).send("Server error has occured");
    }
  }
});

/**
 * Logs in or Registers a given username and password
 */
app.post("/login", async (req, res) => {
  res.type("text");
  let username = req.body.username;
  let password = req.body.password;
  if (!(username && password)) {
    res.status(400).send("Bad Request: Missing Parameters");
  } else {
    try {
      let accounts = JSON.parse(await fs.readFile("accounts.json", "utf8"));
      let identifier = `${username}, ${password}`;
      if (accounts[identifier]) {
        res.status(200).send(`Logged in. Welcome back ${username}!`);
      } else {
        res.status(200).send(`Account registered. Welcome ${username}!`);
        accounts[identifier] = [];
        await fs.writeFile("accounts.json", JSON.stringify(accounts));
      }
    } catch (err) {
      res.status(500).send("Server error has occured");
    }
  }
});

/**
 * Adds a given pokemon to a given user's favorites
 */
app.put("/favorites/add", async (req, res) => {
  res.type("text");
  let username = req.body.username;
  let password = req.body.password;
  let pokemon = req.body.pokemon;
  if (!(username && password && pokemon)) {
    res.status(400).send("Bad Request: Missing Parameters");
  } else {
    try {
      let accounts = JSON.parse(await fs.readFile("accounts.json", "utf8"));
      let identifier = `${username}, ${password}`;
      if (accounts[identifier]) {
        if (!accounts[identifier].includes(pokemon)) {
          accounts[identifier].push(pokemon);
          await fs.writeFile("accounts.json", JSON.stringify(accounts));
          res.status(200).send(`Added ${pokemon} to favorites`);
        } else {
          res.status(200).send(pokemon + " already in favorites");
        }
      } else {
        res.status(400).send("Account doesn't exist!");
      }
    } catch (err) {
      res.status(500).send("Server error has occured");
    }
  }
});

app.use(express.static('public'));
const PORT = process.env.PORT || 8000;
app.listen(PORT);