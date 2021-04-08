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
      message.channel.send("", {
        embed: { title: "Messages by channel", description: totalsMessage },
      });
    }
  );
};


exports.interaction = function(interaction, bot, db) {
  db.query(
    "SELECT * FROM channel_stats WHERE server = ? AND web=1",
    [interaction.guild_id],
    function (err, rows) {
      let totalsMessage = "";
      let total = 0;
      for (let i = 0; i < rows.length; i++) {
        totalsMessage +=
          "\n#" + rows[i].name + ": " + rows[i].total_messages.toLocaleString();
        total += rows[i].total_messages;
      }
      totalsMessage += "\nTotal messages: " + total.toLocaleString();
      let response = {
        data: {
          type: 4,
          data: {
            content : '',
            embeds : [{ title: "Messages by channel", description: totalsMessage }]
          }
        }
      };
      bot.api.interactions(interaction.id, interaction.token).callback.post(response);
    }
  );
}