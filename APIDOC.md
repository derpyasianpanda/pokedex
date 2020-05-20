# Pokemon Favorites API Documentation
The Pokemon Favorites API provides a place to store login information and retrieve information about a specific user's favorites. Note: I used the POST method for check and favorites instead of GET because I needed to pass parameters securely to the server. GET doesn't allow for bodies and passing user information through a URL is not secure.

## Get the favorite pokemon of a certain user
**Request Format:** /favorites

**Request Type:** POST

**Returned Data Format:** JSON

**Description:** Given valid account information (`username`, `password`) that exists in the database, it returns a JSON that contains all the favorites of the user. The favorite pokemon are in the format (pokemon name,id)


**Example Request:** /favorites with POST parameters of `username="KV"` and `password="1234"`

**Example Response:**
```json
[
  "pichu,172", "pikachu,25", "squirtle,7",
  "rayquaza,384", "regigigas,486", "giratina,487"
]
```

**Error Handling:**
If there is no username or password, a response type of text and code of 400 will be sent back with the message `Bad Request: Missing Parameters`.
If the account doesn't exist, a response type of text and code of 400 will be sent back with the message `User doesn't exist!`
If there is a server error, a response type of text and code of 500 will be sent back with the message `Server error has occured`.

## Check if a user has a certain pokemon in their favorites
**Request Format:** /check

**Request Type:** POST

**Returned Data Format:** Plain text

**Description:** Given valid account information (`username`, `password`) that exists in the database and a pokemon in the format (pokemon name,id), it returns a text response of `true` or `false` on whether the user has it as a favorite or not.


**Example Request:** /check with POST parameters of `username="KV"`, `password="1234"`, and `pokemon="giratina,487"`

**Example Response:**
```
true
```

**Error Handling:**
If there is no username or password, a response type of text and code of 400 will be sent back with the message `Bad Request: Missing Parameters`.
If the account doesn't exist, a response type of text and code of 400 will be sent back with the message `User doesn't exist!`
If there is a server error, a response type of text and code of 500 will be sent back with the message `Server error has occured`.

## Login or register a user
**Request Format:** /login

**Request Type:** POST

**Returned Data Format:** Plain text

**Description:** Given valid account information (`username`, `password`), it returns a text response that either confirms a valid login or registration.


**Example Request:** /login with POST parameters of `username="Hung"`, and `password="Le"`

**Example Response:**
```
Account registered. Welcome Hung!
```

**Example Request:** /login with POST parameters of `username="KV"`, and `password="1234"`

**Example Response:**
```
Logged in. Welcome back KV!
```

**Error Handling:**
If there is no username or password, a response type of text and code of 400 will be sent back with the message `Bad Request: Missing Parameters`.
If there is a server error, a response type of text and code of 500 will be sent back with the message `Server error has occured`.

## Add a favorite to a user
**Request Format:** /favorites/add

**Request Type:** PUT

**Returned Data Format:** Plain text

**Description:** Given valid account information (`username`, `password`) that exists in the database and a pokemon in the format (pokemon name,id), it returns a text response of whether a pokemon was added successfully to an account


**Example Request:** /favorites/add with POST parameters of `username="Hung"`, `password="Le"`, and `pokemon="giratina,487"`

**Example Response:**
```
Added giratina,487 to favorites
```

**Example Request:** /favorites/add with POST parameters of `username="KV"`, `password="1234"`, and `pokemon="giratina,487"`

**Example Response:**
```
giratina,487 already in favorites
```

**Error Handling:**
If there is no username or password, a response type of text and code of 400 will be sent back with the message `Bad Request: Missing Parameters`.
If the account doesn't exist, a response type of text and code of 400 will be sent back with the message `User doesn't exist!`
If there is a server error, a response type of text and code of 500 will be sent back with the message `Server error has occured`.