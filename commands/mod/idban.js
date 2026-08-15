const { isMod } = require("../../util");

exports.interaction = function (interaction, bot, db) {
  const userId = interaction.options.getString("id").trim();
  const days = interaction.options.getInteger("days");
  if (isMod(userId, interaction.guild)) {
    interaction.reply(":smirk:");
  } else {
    interaction.guild.members
      .ban(userId)
      .then((user) => {
        let responseText = `:hammer: Banned ${
          user.username || user.id || user
        }`;
        if (days > 0) {
          db.query(
            "INSERT INTO scheduled_actions (action, guild, user, effectivetime) \
                    VALUES ('unban', ?, ?, NOW() + INTERVAL ? DAY)",
            [interaction.guild.id, userId, days]
          );
          responseText += ` for ${days} days`;
        }
        interaction.reply({
          embeds: [
            {
              description: responseText,
            },
          ],
        });
      })
      .catch((error) => {
        interaction.reply(
          ":no_entry: There was an error executing this operation."
        );
        console.error(error);
      });
  }
};
