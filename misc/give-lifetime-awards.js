const mysql = require("mysql2");
const config = require("../config.json");
const thresholds = [100, 200, 400];

const db = mysql.createConnection({
  host: config.mysqlHost,
  user: config.mysqlUser,
  password: config.mysqlPass,
  database: config.mysqlDB,
  charset: "utf8mb4",
});

function giveAwards() {
  db.query(
    "SELECT id, username, lorpoints, lifetime_lorpoints FROM members WHERE server = ? AND lorpoints > 0 AND active=1",
    [config.mainServer],
    function (err, rows) {
      rows.forEach(function (member) {
        const oldLifetimeTotal = member.lifetime_lorpoints;
        const newLifetimeTotal = member.lifetime_lorpoints + member.lorpoints;
        for (const threshold of thresholds) {
          if (oldLifetimeTotal < threshold && newLifetimeTotal >= threshold) {
            db.query(
              "INSERT INTO awards (server, member, award, date) VALUES (?,?,?,CURDATE())",
              [config.mainServer, member.id, threshold + " Lifetime Lorpoints"]
            );
            console.log(
              member.username + " awarded for " + threshold + " lorpoints"
            );
          }
        }
      });
    }
  );
}

giveAwards();
