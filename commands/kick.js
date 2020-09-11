const util = require("../util");
exports.run = function (message) {
  message.mentions.members.forEach(function (member, key, map) {
    if (util.isMod(member, message.channel.guild)) {
      message.reply(":smirk:");
    } else {
      let reason = message.cleanContent.replace("!kick ", "");
      if (!member.kickable) {
        message.channel.send("", {
          embed: {
            description:
              ":warning: I don't have permission to kick that member.",
          },
        });
        return;
      }
      member.kick(reason);
      message.channel.send(member.user.username + " has been kicked.");
    }
  });
};
