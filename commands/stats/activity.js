const config = require("../../config.json");
const { findMember } = require("../../util");

exports.run = async function (message, args, bot, db) {
  const member = await findMember(message, args, bot);
  const botsString = message.content.includes("bots")
    ? "&includebots=true"
    : "";
  const url =
    config.baseUrl +
    "activityreport.php?server=" +
    message.channel.guild.id +
    "&user=" +
    member.id +
    botsString;
  message.channel.send({
    embeds: [{
      title: "Activity Report for " + member.displayName,
      description: url,
    }],
  });
};
