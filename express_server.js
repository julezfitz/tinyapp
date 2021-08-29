const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {};

//Generates a random string of 6 characters
const generateRandomString = function () {
  let randString = '';
  const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  while (randString.length < 6) {
    randString += characters[Math.floor(Math.random() * characters.length)];
  }
  return randString;
};

//Lookup the user object of the user with their user_id cookie
const whatUser = function (userID) {
  const currentUser = users[userID];
  return currentUser;
};

//Lookup a user by their email address and return that user object
const getUserByEmail = function (email) {
  for (const key in users) {
    console.log(users[key]);
    if (users[key]["email"] === email) {
      return users[key];
    }
  }
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  // const currentUser = users[req.cookies["user_id"]];
  const templateVars = {
    username: req.cookies["user_id"],
    user: whatUser(req.cookies["user_id"]),
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: whatUser(req.cookies["user_id"]),
    username: req.cookies["user_id"]
  };
  res.render("urls_new", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL]; //delete the item for which the button was pressed from database
  res.redirect(`/urls`);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    username: req.cookies["user_id"],
    shortURL: req.params.shortURL,
    user: whatUser(req.cookies["user_id"]),
    longURL: urlDatabase[req.params.shortURL],
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  console.log(req.body);
  const shortURL = req.params.shortURL;
  const newLongURL = req.body['change-name']; //gets the new long URL from the form input
  urlDatabase[shortURL] = newLongURL; //assigns the new long URL to the exisiting database record for the shortURL
  console.log(urlDatabase);
  res.redirect(`/urls`);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  const shortURL = generateRandomString(); //Generates new tiny url
  urlDatabase[shortURL] = req.body.longURL; //Adds it to the database
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  console.log(req.params.shortURL);
  const longURL = urlDatabase[req.params.shortURL]; //Looks up long URL from database
  console.log(longURL);
  res.redirect(longURL);
});

app.post("/login", (req, res) => {
  const loginEmail = req.body['email'];
  const user = getUserByEmail(loginEmail);   //Lookup the current user

  if (user) {
    const loginPassword = req.body['password'];
    if (user.password === loginPassword) {
      res.cookie("user_id", user.id);
      return res.redirect("/urls");
    }
  }
  res.status(403);
  const templateVars = {
    error: 'Error. User email and password did not match'
  };
  res.render("login", templateVars);
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  console.log("cookie cleared!");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const templateVars = {
    username: req.cookies["user_id"],
    user: whatUser(req.cookies["user_id"]),
  };
  res.render("registration", templateVars);
});

app.post("/register", (req, res) => {
  const newID = generateRandomString();
  //If the password or email fields are left empty return a 400 error code
  if (!(req.body['password']) || !(req.body['email'])) {
    res.status(400);
    const templateVars = {
      error: 'Error. Please enter an email and password'
    };
    res.render("registration", templateVars);
  }
  const newPassword = req.body['password'];
  const newEmail = req.body['email'];

  if (users && getUserByEmail(newEmail)) {
    res.status(400);
    const templateVars = {
      error: 'Error. An account already exists with this email address'
    };
    res.render("registration", templateVars);
  } else {

    users[newID] = {
      "id": newID,
      "email": newEmail,
      "password": newPassword
    };
    res.cookie("user_id", newID);
    res.redirect("/urls");
  }
  console.log(`User database: ${users}`);
});

app.get("/login", (req, res) => {
  const templateVars = {
    username: req.cookies["user_id"],
    user: whatUser(req.cookies["user_id"]),
  };
  res.render("login", templateVars);
});
