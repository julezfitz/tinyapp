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
const whatUser = function (userID, database) {
  const currentUser = database[userID];
  return currentUser;
};

//Lookup a user by their email address and return that user object
const getUserByEmail = function (email, database) {
  for (const key in database) {
    if (database[key]["email"] === email) {
      return database[key];
    }
  }
};

//Lookup urls with a specific userID
const urlsByUser = function (userID, database) {
  let URLs = {};
  for (const key in database) {
    if (database[key]["userID"] === userID) {
      URLs[key] = database[key];
    }
  }
  return URLs;
};

module.exports = {
  generateRandomString,
  whatUser,
  getUserByEmail,
  urlsByUser
};