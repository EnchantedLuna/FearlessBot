const util = require("../../util");

exports.interaction = function (interaction, bot, db) {
  const setting = interaction.options.getString("setting");
  const value = interaction.options.getString("value");
  util.setGuildConfig(interaction.guild.id, setting, value, db);
  interaction.reply("Settings has been updated.");
};
