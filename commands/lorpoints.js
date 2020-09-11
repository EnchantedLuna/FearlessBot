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
          "SELECT SUM(lorpoints) AS total FROM members WHERE server = ?",
          [message.channel.guild.id],
          function (err, totals) {
            message.channel.send("", {
              embed: {
                description:
                  rows[0].username +
                  " has " +
                  rows[0].lorpoints +
                  " lorpoints.",
              },
            });
          }
        );
      }
    }
  );
};
