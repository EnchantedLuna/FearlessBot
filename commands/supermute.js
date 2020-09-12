const { isMod } = require("../util");

exports.run = function (message, args, bot, db) {
  const argSet = args.split(" ");
  const hours = parseInt(argSet[0]);
  let supermute = message.channel.guild.roles.cache.find(
    (role) => role.name === "supermute"
  );
  let active = message.channel.guild.roles.cache.find(
    (role) => role.name === "active"
  );
  message.mentions.members.forEach(function (member, key, map) {
    if (isMod(member, message.channel.guild)) {
      message.channel.send(":smirk:");
    } else {
      member.roles.add(supermute);
      member.roles.remove(active);
      var timeMessage = "";
      if (hours > 0) {
        db.query(
          "INSERT INTO scheduled_actions (action, guild, user, effectivetime) VALUES ('unmute', ?, ?, NOW() + INTERVAL ? HOUR)",
          [message.channel.guild.id, member.user.id, hours]
        );
        timeMessage = " for " + hours + " hour";
        timeMessage += hours != 1 ? "s" : "";
      }
      message.channel.send(
        ":mute: " +
          member.user.username +
          " has been supermuted" +
          timeMessage +
          "."
      );
    }
  });
};
