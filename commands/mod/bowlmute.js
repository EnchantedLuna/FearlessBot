const { isMod } = require("../../util");

exports.run = function (message, args, bot, db) {
  const argSet = args.split(" ");
  const hours = parseInt(argSet[0]);
  let bowlMute = message.channel.guild.roles.cache.find(
    (role) => role.name === "bowlmute"
  );
  if (typeof bowlMute === "undefined") {
    return;
  }
  message.mentions.members.forEach(function (member, key, map) {
    if (isMod(member, message.channel.guild)) {
      message.channel.send(":smirk:");
    } else {
      member.roles.add(bowlMute);
      var timeMessage = "";
      if (hours > 0) {
        db.query(
          "INSERT INTO scheduled_actions (action, guild, user, effectivetime) VALUES ('unbowlmute', ?, ?, NOW() + INTERVAL ? HOUR)",
          [message.channel.guild.id, member.user.id, hours]
        );
        timeMessage = " for " + hours + " hour";
        timeMessage += hours != 1 ? "s" : "";
      }
      message.channel.send(
        ":bowl_with_spoon::mute:" +
          member.user.username +
          " has been bowl muted" +
          timeMessage +
          "."
      );
    }
  });
};
