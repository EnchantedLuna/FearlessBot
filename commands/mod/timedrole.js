const { log } = require("../../util");

exports.interaction = function (interaction, bot, db) {
  const member = interaction.options.getMember("member");
  const days = interaction.options.getInteger("days") ?? 0;
  const hours = interaction.options.getInteger("hours") ?? 0;
  const role = interaction.options.getRole("role");
  if (days == 0 && hours == 0) {
    interaction.reply("A time interval must be set.");
    return;
  }
  if (role.position >= interaction.member.roles.highest.position) {
    interaction.reply("You do not have permission to assign this role.");
    return;
  }
  if (role.position >= interaction.guild.members.me.roles.highest.position) {
    interaction.reply("The bot does not have permission to assign this role.");
    return;
  }
  member.roles.add(role);
  interaction.reply({
    embeds: [
      {
        description:
          ":hammer: " +
          member.user.username +
          " (" +
          member.user.id +
          ")" +
          " has been given the " +
          role.name +
          " role.",
      },
    ],
  });
  let timeMessage = "indefinitely";
  if (days > 0 || hours > 0) {
    totalHours = days * 24 + hours;
    db.query(
      "INSERT INTO scheduled_actions (action, guild, user, effectivetime, roleid) \
                  VALUES ('removerole', ?, ?, NOW() + INTERVAL ? HOUR, ?)",
      [interaction.guild.id, member.user.id, totalHours, role.id]
    );
    timeMessage = "for " + days + " day";
    timeMessage += days !== 1 ? "s" : "";
    if (hours > 0) {
      timeMessage += " and " + hours + " hour";
      timeMessage += hours !== 1 ? "s" : "";
    }
  }
  log(
    interaction.guild,
    member.user.username +
      " (" +
      member.user.id +
      ")" +
      " has been given the " +
      role.name +
      " role " +
      timeMessage +
      " by " +
      interaction.user.username
  );
};
