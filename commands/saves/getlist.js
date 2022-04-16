const config = require("../../config.json");

exports.run = function (message) {
  message.reply(
    config.baseUrl + "fearlessdata.php?server=" + message.channel.guild.id
  );
};

exports.interaction = function (interaction, bot, db) {
  interaction.reply({
    content: config.baseUrl + "fearlessdata.php?server=" + interaction.guild.id,
    ephemeral: true
  });
};