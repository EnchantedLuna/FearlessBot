const { findMemberID } = require("../../util");

exports.run = function (message, args, bot, db) {
  const member = findMemberID(message, args, bot);

  db.query(
    "SELECT username, lorpoints, eventpoints FROM members WHERE server = ? AND id = ?",
    [message.channel.guild.id, member],
    function (err, rows) {
      if (err) {
        console.error("lorpoint command db error: " + err);
        return;
      }
      if (rows[0] !== null) {
        db.query(
          "SELECT COUNT(*) AS higher FROM members WHERE server = ? AND lorpoints > ?",
          [message.channel.guild.id, rows[0].lorpoints],
          function (err, totals) {
            const rank = totals[0].higher + 1;
            message.channel.send("", {
              embed: {
                title: ":star: Lorpoints",
                description:
                  rows[0].username +
                  " has " +
                  rows[0].lorpoints +
                  " lorpoints.\nCurrent Rank: " +
                  rank +
                  getSuffix(rank) +
                  "\nCapped events this week: " +
                  rows[0].eventpoints,
              },
            });
          }
        );
      }
    }
  );
};

function getSuffix(number) {
  const lastDigit = number % 10;
  if (lastDigit === 1 && number % 100 != 11) {
    return "st";
  } else if (lastDigit === 2 && number % 100 != 12) {
    return "nd";
  } else if (lastDigit === 3 && number % 100 != 13) {
    return "rd";
  }
  return "th";
}
