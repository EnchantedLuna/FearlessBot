const config = require("../../config.json");

exports.interaction = function (interaction, bot, db) {
  interaction.reply({
    content: config.baseUrl + "fearlessdata.php?server=" + interaction.guild.id,
    ephemeral: true,
  });
};
