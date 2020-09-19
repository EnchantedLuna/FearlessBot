const config = require("../config.json");

exports.run = function (message, args, bot, db) {
  const user =
    message.mentions.users.size > 0
      ? message.mentions.users.first()
      : message.author;
  const botsString = message.content.includes("bots")
    ? "&includebots=true"
    : "";
  const url =
    config.baseUrl +
    "activityreport.php?server=" +
    message.channel.guild.id +
    "&user=" +
    user.id +
    botsString;
  message.channel.send("", {
    embed: { title: "Activity Report for " + user.tag, description: url },
  });
};
