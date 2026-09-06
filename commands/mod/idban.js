const { isMod } = require("../../util");

exports.interaction = function (interaction, bot, db) {
  const userId = interaction.options.getString("id").trim();
  const days = interaction.options.getInteger("days");
  if (isMod(userId, interaction.guild)) {
    interaction.reply(":smirk:");
    return;
  }
  interaction.guild.members
    .fetch(userId)
    .then((member) => {
      if (member.user.bot) {
        interaction.reply({
          embeds: [
            {
              description:
                ":warning: Sadly, I cannot ban another fellow robot. :robot:",
            },
          ],
        });
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
    })
    .catch((error) => {
      interaction.reply(":no_entry: I could not find that member.");
    });
};
