exports.run = function (message, args, bot, db) {
  db.query(
    "SELECT * FROM channel_stats WHERE server = ? AND web=1",
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
      message.channel.send({
        embeds: [{ title: "Messages by channel", description: totalsMessage }],
      });
    }
  );
};


exports.interaction = function(interaction, bot, db) {
  db.query(
    "SELECT * FROM channel_stats WHERE server = ? AND web=1",
    [interaction.guild.id],
    function (err, rows) {
      let totalsMessage = "";
      let total = 0;
      for (let i = 0; i < rows.length; i++) {
        totalsMessage +=
          "\n#" + rows[i].name + ": " + rows[i].total_messages.toLocaleString();
        total += rows[i].total_messages;
      }
      totalsMessage += "\nTotal messages: " + total.toLocaleString();
      interaction.reply({ embeds : [{ title: "Messages by channel", description: totalsMessage }] })
    }
  );
}