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
    member.roles.highest.position >=
      interaction.member.roles.highest.position &&
    member.user.id !== interaction.user.id
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
    ephemeral: true,
  });
};
