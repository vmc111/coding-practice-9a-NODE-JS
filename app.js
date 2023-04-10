const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

// Initialize the dataBase
let db = null;
const RunDataBaseServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server Running http://localhost:3000");
    });
  } catch (e) {
    console.log(`DateBase Error: ${e.message}`);
  }
};

RunDataBaseServer(); // Run DataBase

// API 1

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  const checkUserQuery = `
    SELECT * FROM user WHERE username = '${username}';`;

  let userInTable = await db.get(checkUserQuery);

  if (userInTable === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log(hashedPassword);
      const addUser = `
            INSERT INTO user
            (username, name, gender, location, password)
            VALUES ('${username}', '${name}', '${gender}', '${location}', '${hashedPassword}');`;

      await db.run(addUser);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// API 2

app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const checkUserQuery = `
    SELECT * FROM user WHERE username = '${username}';`;

  let userInTable = await db.get(checkUserQuery);

  if (userInTable === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const checkPassword = await bcrypt.compare(password, userInTable.password);

    if (checkPassword) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// API 3

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const checkUserQuery = `
        SELECT * FROM user WHERE username = '${username}';`;
  let dbUser = await db.get(checkUserQuery);

  let checkPassword = await bcrypt.compare(oldPassword, dbUser.password);

  if (checkPassword) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let newHashedPassword = await bcrypt.hash(newPassword, 10);
      const changePasswordQuery = `
        UPDATE user 
        SET 
        password = '${newHashedPassword}'
        WHERE 
            username = '${username}';`;

      await db.run(changePasswordQuery);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
