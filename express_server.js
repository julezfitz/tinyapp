const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const cookieParser = require("cookie-parser");

const helpers = require('./helpers.js');
const generateRandomString = helpers.generateRandomString;
const whatUser = helpers.whatUser;
const getUserByEmail = helpers.getUserByEmail;
const urlsByUser = helpers.urlsByUser;
const uniqueVisits = helpers.uniqueVisits;

app.use(bodyParser.urlencoded({ extended: true }));

app.use(methodOverride('_method'));

app.use(cookieParser());

app.use(cookieSession({
  name: 'session',
  keys: ['xFr54$gdEW13v78'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.set("view engine", "ejs");

const urlDatabase = {};

const users = {};

app.get("/urls", (req, res) => {
  //if not logged in, bring user to login page
  if (!req.session.user_id) {
    res.status(403);
    return res.render("login");
  } else {

    const templateVars = {
      userID: req.session.user_id,
      user: whatUser(req.session.user_id, users),
      urls: urlsByUser(req.session.user_id, urlDatabase)
    };
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  //If the user is not logged in, send 403 error and direct to log in page
  if (!req.session.user_id) {
    res.status(403);
    return res.render("login");
  }

  const templateVars = {
    user: whatUser(req.session.user_id, users),
    userID: req.session.user_id
  };
  res.render("urls_new", templateVars);
});

app.delete("/urls/:shortURL", (req, res) => {
  // if the user is logged in, allow deletion
  if (req.session.user_id) {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL]; //delete the item for which the button was pressed from database
    res.redirect(`/urls`);

    //Otherwise 403 error and direct to login page
  } else {
    res.status(403);
    res.render("login");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  //If the user is not logged in, send 403 error and direct to log in page
  if (!req.session.user_id) {
    res.status(403);
    return res.render("login");
  }

  const templateVars = {
    userID: req.session.user_id,
    shortURL: req.params.shortURL,
    user: whatUser(req.session.user_id, users),
    longURL: urlDatabase[req.params.shortURL]["longURL"],
    urlDatabase,
    uniqueVisitCount: uniqueVisits(urlDatabase[req.params.shortURL], urlDatabase),
  };
  res.render("urls_show", templateVars);
});

app.put("/urls/:shortURL", (req, res) => {
  //If the user is not logged in, send 403 error and direct to log in page
  if (!req.session.user_id) {
    res.status(403);
    return res.render("login");
  }

  //Check to ensure a long url is input. Return an error if not
  if (!req.body['change-name']) {
    const templateVars = {
      userID: req.session.user_id,
      shortURL: req.params.shortURL,
      user: whatUser(req.session.user_id, users),
      longURL: urlDatabase[req.params.shortURL]["longURL"],
      urlDatabase,
      uniqueVisitCount: uniqueVisits(urlDatabase[req.params.shortURL]),
      error: 'Please enter a URL'
    };
    res.status(400);
    res.render("urls_show", templateVars);

  } else {
    const shortURL = req.params.shortURL;
    const newLongURL = req.body['change-name']; //gets the new long URL from the form input
    urlDatabase[shortURL]["longURL"] = newLongURL; //assigns the new long URL to the exisiting database record
    res.redirect(`/urls`);
  }

});

app.post("/urls", (req, res) => { //Generates new tiny url and adds it to the database
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { "longURL": req.body.longURL, "userID": req.session.user_id, "userVisits": [] };
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  let uniqueVisitorID = req.cookies.uniqueVisitorID;
  if (!uniqueVisitorID) { //Set a unique visitor ID to the URL visitor if one does not exist
    uniqueVisitorID = generateRandomString();
    res.cookie('uniqueVisitorID', uniqueVisitorID, { maxAge: 365 * 24 * 60 * 60 * 1000 });
  }
  const userVisit = { "timeStamp": new Date(), "uniqueVisitorID": uniqueVisitorID }; //Create a record of the link access details
  urlDatabase[req.params.shortURL]["userVisits"].push(userVisit);

  const longURL = urlDatabase[req.params.shortURL]["longURL"]; //Looks up long URL from database
  res.redirect(longURL);
});

app.post("/login", (req, res) => {
  const loginEmail = req.body['email'];
  const user = getUserByEmail(loginEmail, users); //Lookup the current user
  let templateVars;

  if (user) { //If the user exists check password against stored hashed password
    const loginPassword = req.body['password'];

    //If username and password are correct
    if (bcrypt.compareSync(loginPassword, user.password)) {
      req.session.user_id = user.id; //Set cookie to the user's id
      return res.redirect("/urls");
    } else {
      res.status(403);
      templateVars = {error: 'Error. Incorrect password'};
    }
  } else if (!loginEmail) {
    res.status(403);
    templateVars = {error: 'Error. Please enter an email address'};
  } else {
    res.status(403);
    templateVars = {error: 'Error. No TinyApp account'};
  }
  res.render("login", templateVars); //render the login page with the error message
});

app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const templateVars = {
    userID: req.session.user_id,
    user: whatUser(req.session.user_id, users),
  };
  res.render("registration", templateVars);
});

app.post("/register", (req, res) => {
  const newID = generateRandomString();

  //If the password or email fields are left empty return a 400 error code
  if (!(req.body['password']) || !(req.body['email'])) {
    res.status(400);
    res.render("registration", { error: 'Error. Please enter an email and password' });

    //If email already exists return error
  } else if (users && getUserByEmail(req.body['email'], users)) {
    res.status(400);
    const templateVars = {
      error: 'Error. An account already exists with this email address'
    };
    res.render("registration", templateVars);
  } else {

    //Otherwise, create new user
    users[newID] = {
      "id": newID,
      "email": req.body['email'],
      "password": bcrypt.hashSync(req.body['password'], 10)   //hash new password
    };
    req.session.user_id = newID; //Set cookie to the user's id
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  const templateVars = {
    userID: req.session.user_id,
    user: whatUser(req.session.user_id, users),
  };
  res.render("login", templateVars);
});

app.get("/home", (req, res) => {
  const templateVars = {
    userID: req.session.user_id,
    user: whatUser(req.session.user_id, users),
  };
  res.render("home", templateVars);
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
