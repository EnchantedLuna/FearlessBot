const { isMod } = require("../../util");

exports.run = function (message, args, bot, db) {
  const argSet = args.split(" ");
  const hours = parseInt(argSet[0]);
  const supermute = message.channel.guild.roles.cache.find(
    (role) => role.name === "supermute"
  );
  const active = message.channel.guild.roles.cache.find(
    (role) => role.name === "active"
  );
  if (!supermute) {
    message.channel.send({
      embeds: [
        {
          description:
            ":warning: Could not find ``supermute`` role. A role named ``supermute`` is required to use this command.",
        },
      ],
    });
    return;
  }
  message.mentions.members.forEach(function (member, key, map) {
    if (
      isMod(member, message.channel.guild) &&
      member.id !== message.author.id
    ) {
      message.channel.send(":smirk:");
    } else {
      member.roles.add(supermute);
      if (active) {
        member.roles.remove(active);
      }
      let timeMessage = "";
      if (hours > 0) {
        db.query(
          "INSERT INTO scheduled_actions (action, guild, user, effectivetime) VALUES ('unmute', ?, ?, NOW() + INTERVAL ? HOUR)",
          [message.channel.guild.id, member.user.id, hours]
        );
        timeMessage = " for " + hours + " hour";
        timeMessage += hours !== 1 ? "s" : "";
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

exports.interaction = function (interaction, bot, db) {
  const member = interaction.options.getMember("member");
  const days = interaction.options.getInteger("days") ?? 0;
  const hours = interaction.options.getInteger("hours") ?? 0;
  const reason =
    interaction.options.getString("reason") ?? "(no reason provided)";
  if (days == 0 && hours == 0) {
    interaction.reply("A time interval must be set.");
    return;
  }
  const totalHours = days * 24 + hours;
  const interval = totalHours * 3600 * 1000;
  if (!member.moderatable) {
    interaction.reply({
      embeds: [
        {
          description:
            ":warning: I don't have permission to timeout that member.",
        },
      ],
    });
    return;
  }
  if (
    member.roles.highest.position >= interaction.member.roles.highest.position
  ) {
    interaction.reply("You do not have permission to timeout that member.");
    return;
  }
  member.timeout(interval, "By " + interaction.user.username + ": " + reason);
  interaction.reply({
    embeds: [
      {
        description:
          ":alarm_clock: " +
          member.user.username +
          " (" +
          member.user.id +
          ")" +
          " has been timed out.",
      },
    ],
  });
};
