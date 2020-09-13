exports.run = function (message, args, bot, db) {
  let member;
  if (message.mentions.members.size > 0) {
    member = message.mentions.members.first().user.id;
  } else {
    member = message.author.id;
  }

  db.query(
    "SELECT username, lorpoints FROM members WHERE server = ? AND id = ?",
    [message.channel.guild.id, member],
    function (err, rows) {
      if (rows[0] !== null) {
        db.query(
          "SELECT COUNT(*) AS higher FROM members WHERE server = ? AND lorpoints > ?",
          [message.channel.guild.id, rows[0].lorpoints],
          function (err, totals) {
            const rank = totals[0].higher + 1;
            message.channel.send("", {
              embed: {
                description:
                  rows[0].username +
                  " has " +
                  rows[0].lorpoints +
                  " lorpoints.\nCurrent Rank: " +
                  rank +
                  getSuffix(rank),
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
  if (lastDigit === 1 && number != 11) {
    return "st";
  } else if (lastDigit === 2 && number != 12) {
    return "nd";
  } else if (lastDigit === 3 && number != 13) {
    return "rd";
  }
  return "th";
}
