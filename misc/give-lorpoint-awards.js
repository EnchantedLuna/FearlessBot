const mysql = require("mysql2");
const config = require("../config.json");
const LORPOINTS_SEASON = 3;

const db = mysql.createConnection({
  host: config.mysqlHost,
  user: config.mysqlUser,
  password: config.mysqlPass,
  database: config.mysqlDB,
  charset: "utf8mb4",
});

function getSuffix(number) {
  const lastDigit = number % 10;
  if (lastDigit === 1 && number % 100 !== 11) {
    return "st";
  } else if (lastDigit === 2 && number % 100 !== 12) {
    return "nd";
  } else if (lastDigit === 3 && number % 100 !== 13) {
    return "rd";
  }
  return "th";
}

function giveAwards() {
  let entries = [];
  db.query(
    "SELECT id, username, lorpoints FROM members WHERE server = ? AND lorpoints > 0 AND active=1 ORDER BY lorpoints DESC",
    [config.mainServer],
    function (err, rows) {
      let count = 0;
      let rank = 0;
      let previousThing = null;
      rows.forEach(function (member) {
        count++;
        rank = member.lorpoints === previousThing ? rank : count;
        previousThing = member.lorpoints;
        let word = member.lorpoints > 1 ? "lorpoints" : "lorpoint";
        let awardText =
          rank +
          getSuffix(rank) +
          " Place - Lorpoints Season " +
          LORPOINTS_SEASON +
          " (" +
          member.lorpoints +
          " " +
          word +
          ")";
        db.query(
          "INSERT INTO awards (server, member, award, date) VALUES (?,?,?,CURDATE())",
          [config.mainServer, member.id, awardText]
        );
      });
    }
  );
}

giveAwards();
