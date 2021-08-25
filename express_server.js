const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//Generates a random string of 6 characters
const generateRandomString = function () {
  let randString = '';
  const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  while (randString.length < 6) {
    randString += characters[Math.floor(Math.random() * characters.length)];
  }
  return randString;
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
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"]};
  res.render("urls_new", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  console.log("You deleted me!!!!");
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL]; //delete the item for which the button was pressed from database
  console.log(urlDatabase);
  res.redirect(`/urls`);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { username: req.cookies["username"], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
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
  const cookieUsername = req.body['username']; //gets the username from the form input
  res.cookie("username",cookieUsername);
  res.redirect("/urls");
  console.log(req.cookies["username"]);
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  console.log("cookie cleared!");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const templateVars = { username: req.cookies["username"]};
  res.render("registration", templateVars);

});
