const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');
const { urlsByUser } = require('../helpers.js');
const { whatUser } = require('../helpers.js');


const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const testURLDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  djwhsN: { longURL: "https://www.amazon.ca", userID: "b4sGHe" },
  Wy4cFs: { longURL: "https://www.gov.gc.ca", userID: "b4sGHe" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

describe('getUserByEmail', function () {
  it('should return a user with valid email', function () {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedOutput = "userRandomID";
    assert.strictEqual(user.id, expectedOutput);
  });
  it('should return undefined with an invalid email', function () {
    const user = getUserByEmail("silly@example.com", testUsers);
    const expectedOutput = undefined;
    assert.strictEqual(user, expectedOutput);
  });
});

describe('urlsByUser', function () {
  it('should return URLs associated with a specific user', function () {
    const urls = urlsByUser("aJ48lW", testURLDatabase);
    const expectedOutput = {
      b6UTxQ: { longURL: 'https://www.tsn.ca', userID: 'aJ48lW' },
      i3BoGr: { longURL: 'https://www.google.ca', userID: 'aJ48lW' }
    };
    assert.deepEqual(urls, expectedOutput);
  });
  it('should return an empy object if no URLs exist for that user', function () {
    const urls = urlsByUser("gdj43s", testURLDatabase);
    const expectedOutput = {};
    assert.deepEqual(urls, expectedOutput);
  });
  it('should not return URLs that were created by another user', function () {
    const urls = urlsByUser("b4sGHe", testURLDatabase);
    const lookUpURL = urls.i3BoGr;
    const expectedOutput = undefined;
    assert.strictEqual(lookUpURL, expectedOutput);
  });
});

describe('whatUser', function () {
  it('should return a user object with user ID', function () {
    const user = whatUser("userRandomID", testUsers);
    const expectedOutput = {
      id: "userRandomID",
      email: "user@example.com",
      password: "purple-monkey-dinosaur"
    };
    assert.deepEqual(user, expectedOutput);
  });
  it('should return undefined with an invalid user ID', function () {
    const user = whatUser("userFakeID", testUsers);
    const expectedOutput = undefined;
    assert.strictEqual(user, expectedOutput);
  });
});