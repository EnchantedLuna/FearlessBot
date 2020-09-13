exports.run = function (message, args, bot, db) {
  let member;
  if (message.mentions.members.size > 0) {
    member = message.mentions.members.first().user;
  } else {
    member = message.author;
  }

  db.query(
    "SELECT * FROM awards WHERE server = ? AND member = ? ORDER BY date, id",
    [message.channel.guild.id, member.id],
    function (err, rows) {
      if (err != null) {
        console.log(err);
        return;
      }
      if (rows[0] != null) {
        let awardsText = "";
        for (let i = 0; i < rows.length; i++) {
          let date = rows[i].date.toDateString();
          awardsText += i + 1 + ". " + rows[i].award + " [" + date + "]\n";
        }
        message.channel.send("", {
          embed: {
            title: "Awards for " + member.username,
            description: awardsText,
          },
        });
      } else {
        message.channel.send("", {
          embed: {
            title: "Awards for " + member.username,
            description: "none :frowning: ",
          },
        });
      }
    }
  );
};
