const config = require("../config.json");

exports.run = function (message, args, bot, db) {
  search =
    message.mentions.members.size > 0
      ? message.mentions.members.first().id
      : message.author.id;
  let botsString = message.content.includes("bots") ? "&includebots=true" : "";
  message.reply(
    config.baseUrl +
      "activityreport.php?server=" +
      message.channel.guild.id +
      "&user=" +
      search +
      botsString
  );
};
