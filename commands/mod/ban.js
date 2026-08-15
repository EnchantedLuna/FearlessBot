const { isMod, log } = require("../../util");

exports.interaction = function (interaction, bot, db) {
  const member = interaction.options.getMember("member");
  const reason = interaction.options.getString("reason");
  const days = interaction.options.getInteger("days");

  if (isMod(member, interaction.guild)) {
    interaction.reply(":smirk:");
    return;
  }

  if (!member.bannable) {
    interaction.reply({
      embeds: [
        {
          description: ":warning: I don't have permission to ban that member.",
        },
      ],
    });
    return;
  }
  member.ban({ reason: reason ?? "" });
  interaction.reply({
    embeds: [
      {
        description:
          ":hammer: " +
          member.user.username +
          " (" +
          member.user.id +
          ")" +
          " has been banned.",
      },
    ],
  });
  let timeMessage = "indefinitely";
  if (days > 0) {
    db.query(
      "INSERT INTO scheduled_actions (action, guild, user, effectivetime) \
                  VALUES ('unban', ?, ?, NOW() + INTERVAL ? DAY)",
      [interaction.guild.id, member.user.id, days]
    );
    timeMessage = "for " + days + " day";
    timeMessage += days !== 1 ? "s" : "";
  }
  log(
    interaction.guild,
    member.user.username +
      " (" +
      member.user.id +
      ")" +
      " has been banned " +
      timeMessage +
      " by " +
      interaction.user.username
  );
};
