const mysql = require("mysql2");
const config = require("../config.json");
const threshold = 100;

const db = mysql.createConnection({
  host: config.mysqlHost,
  user: config.mysqlUser,
  password: config.mysqlPass,
  database: config.mysqlDB,
  charset: "utf8mb4",
});

function giveAwards() {
  db.query(
    "SELECT id, username, lorpoints FROM members WHERE server = ? AND lifetime_lorpoints > " +
      threshold +
      " AND active=1",
    [config.mainServer],
    function (err, rows) {
      rows.forEach(function (member) {
        db.query(
          "INSERT INTO awards (server, member, award, date) VALUES (?,?,?,CURDATE())",
          [config.mainServer, member.id, threshold + " Lifetime Lorpoints"]
        );
      });
    }
  );
}

giveAwards();
