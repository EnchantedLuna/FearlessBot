exports.run = function (message, page, bot, db, thing) {
  if (isNaN(page) || page < 1) {
    page = 1;
  }
  let offset = 20 * (page - 1);
  let rankString = "";
  db.query(
    "SELECT username, " +
      thing +
      " AS thing FROM members WHERE server = ? AND " +
      thing +
      " > 0 AND active=1 ORDER BY " +
      thing +
      " DESC LIMIT ?, 20",
    [message.channel.guild.id, offset],
    function (err, rows) {
      let count = offset + 1;
      rows.forEach(function (member) {
        rankString +=
          count +
          ": " +
          member.username +
          " - " +
          member.thing +
          " " +
          thing +
          "\n";
        count++;
      });
      message.channel.send("", {
        embed: {
          title: "Users with most " + thing,
          description: rankString,
          footer: { text: "Page " + page },
        },
      });
    }
  );
};
