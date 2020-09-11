exports.run = function (message, args, bot, db) {
  db.query(
    "SELECT * FROM channel_stats WHERE server = ?",
    [message.channel.guild.id],
    function (err, rows) {
      let totalsMessage = "";
      let total = 0;
      for (let i = 0; i < rows.length; i++) {
        totalsMessage +=
          "\n#" + rows[i].name + ": " + rows[i].total_messages.toLocaleString();
        total += rows[i].total_messages;
      }
      totalsMessage += "\nTotal messages: " + total.toLocaleString();
      message.channel.send("", {
        embed: { title: "Messages by channel", description: totalsMessage },
      });
    }
  );
};
