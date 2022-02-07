const util = require("../../util");
exports.run = function (message) {
  message.mentions.members.forEach(function (member, key, map) {
    if (util.isMod(member, message.channel.guild)) {
      message.channel.send(":smirk:");
    } else {
      let reason = "Kicked by " + message.author.tag;
      if (!member.kickable) {
        message.channel.send({
          embeds: [{
            description:
              ":warning: I don't have permission to kick that member.",
          }],
        });
        return;
      }
      member.kick(reason);
      message.channel.send(member.user.tag + " has been kicked.");
    }
  });
};
