// Initialize server & starts server

const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const dbPath = path.join(__dirname, "userData.db");
const app = express();

app.use(express.json());
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB ERROR ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const validatePassword = (password) => {
  return password.length > 4;
};

//Register API
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUsersQuery = `SELECT * 
 FROM user 
 WHERE username = '${username}';`;
  const dbUser = await db.get(selectUsersQuery);
  if (dbUser === undefined) {
    const createUserQuery = `INSERT INTO 
    user (username,name,password,gender,location)
    VALUES(
        '${username}',
        '${name}',
        '${hashedPassword}',
        '${gender}',
        '${location}'
        );`;
    if (validatePassword(password)) {
      await db.run(createUserQuery);
      response.send("User created successfully"); //scenario-3 Successful registration of the registrant
    } else {
      response.status(400);
      response.send("Password is too short"); //scenario-2 password validation
    }
  } else {
    response.status(400);
    response.send("User already exists"); //scenario-1 username already exists
  }
});

//API-2 login page

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT *
      FROM user
       WHERE username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user"); //Scenario 1 If an unregistered user tries to login
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);

    if (isPasswordMatched === true) {
      response.send("Login success!"); //Scenario 3 Successful login of the use
    } else {
      response.status(400);
      response.send("Invalid password"); //Scenario 2 If the user provides incorrect password
    }
  }
});

//API 3 Method: PUT

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `SELECT *
      FROM user
       WHERE username = '${username}';`;

  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isPasswordMatched === true) {
      if (validatePassword(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `UPDATE user
          SET password = '${hashedPassword}'
          WHERE username = '${username}';`;

        const user = await db.run(updatePasswordQuery);
        response.send("Password updated"); //Scenario-3 Password updated
      } else {
        response.status(400);
        response.send("Password is too short"); // Scenario 2 Password is too short
      }
    } else {
      response.status(400);
      response.send("Invalid current password"); //Scenario 3 Password updated
    }
  }
});
module.exports = app;
