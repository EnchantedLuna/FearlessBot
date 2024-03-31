const config = require("../../config.json");

exports.interaction = function (interaction, bot, db) {
  if (interaction.user.id != config.botAdminUserId) {
    interaction.reply({
      content: "You do not have permission to run this command.",
      ephemeral: true,
    });
    return;
  }
  let message = interaction.options.getString("message");
  interaction.channel.send(message);
  interaction.reply({
    content: "Message sent.",
    ephemeral: true,
  });
};
