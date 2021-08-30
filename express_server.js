const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')
const bcrypt = require('bcryptjs');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieSession({
  name: 'session',
  keys: ['xFr54$gdEW13v78'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.set("view engine", "ejs");

const urlDatabase = {};

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

//Lookup the user object of the user with their userID cookie
const whatUser = function (userID) {
  const currentUser = users[userID];
  return currentUser;
};

//Lookup a user by their email address and return that user object
const getUserByEmail = function (email) {
  for (const key in users) {
    if (users[key]["email"] === email) {
      return users[key];
    }
  }
};

//Lookup urls with a specific userID
const urlsByUser = function (userID) {
  let URLs = {};
  for (const key in urlDatabase) {
    if (urlDatabase[key]["userID"] === userID) {
      URLs[key] = urlDatabase[key];
    }
  }
  return URLs;
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
  //if not logged in, bring user to login page
  if (!req.session.user_id) {
    res.status(403);
    return res.render("login");
  } else {

    const templateVars = {
      userID: req.session.user_id,
      user: whatUser(req.session.user_id),
      urls: urlsByUser(req.session.user_id)
    };
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  //if not logged in, bring user to login page
  if (!req.session.user_id) {
    res.status(403);
    return res.render("login");
  }

  const templateVars = {
    user: whatUser(req.session.user_id),
    userID: req.session.user_id
  };
  res.render("urls_new", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  // if the user is logged in, allow deletion. Otherwise 403 error and direct to log in page
  if (req.session.user_id) {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL]; //delete the item for which the button was pressed from database
    res.redirect(`/urls`);
  } else {
    res.status(403);
    res.render("login");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  //if not logged in, bring user to login page
  if (!req.session.user_id) {
    res.status(403);
    return res.render("login");
  }

  const templateVars = {
    userID: req.session.user_id,
    shortURL: req.params.shortURL,
    user: whatUser(req.session.user_id),
    longURL: urlDatabase[req.params.shortURL]["longURL"],
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  // if the user is logged in, allow editing. Otherwise 403 error and direct to log in page
  if (req.session.user_id) {
    const shortURL = req.params.shortURL;
    const newLongURL = req.body['change-name']; //gets the new long URL from the form input
    urlDatabase[shortURL] = { "longURL": newLongURL, "userID": req.session.user_id }; //assigns the new long URL to the exisiting database record for the shortURL
    console.log(urlDatabase);
    res.redirect(`/urls`);
  } else {
    res.status(403);
    res.render("login");
  }
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString(); //Generates new tiny url
  urlDatabase[shortURL] = { "longURL": req.body.longURL, "userID": req.session.user_id }; //Adds it to the database
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]["longURL"]; //Looks up long URL from database
  res.redirect(longURL);
});

app.post("/login", (req, res) => {
  const loginEmail = req.body['email'];
  const user = getUserByEmail(loginEmail);   //Lookup the current user
  let templateVars;

  if (user) {
    const loginPassword = req.body['password'];
    if (bcrypt.compareSync(loginPassword, user.password)) { //Check entered password against stored hashed password
      req.session.user_id = user.id; //Set cookie to the user's id
      return res.redirect("/urls");
    } else {
      res.status(403);
      templateVars = {
        error: 'Error. Incorrect password'
      };
    }
  } else {
    res.status(403);
    templateVars = {
      error: 'Error. An account with this email does not exist'
    };
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
    user: whatUser(req.session.user_id),
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
  const newPassword = bcrypt.hashSync(req.body['password'], 10);   //hash new password
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
    req.session.user_id = newID; //Set cookie to the user's id
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  const templateVars = {
    userID: req.session.user_id,
    user: whatUser(req.session.user_id),
  };
  res.render("login", templateVars);
});

app.get("/home", (req, res) => {
  const templateVars = {
    userID: req.session.user_id,
    user: whatUser(req.session.user_id),
  };
  res.render("home", templateVars);
});
