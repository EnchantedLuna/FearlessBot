const { clearCacheValue } = require("../../util");

exports.interaction = async function (interaction, bot, db) {
  const value = interaction.options.getString("list");
  db.query(
    "UPDATE channel_stats SET blocked_commands=? WHERE server = ? AND channel = ?",
    [value, interaction.guild.id, interaction.channel.id]
  );
  interaction.reply(
    "Command options have been updated. To block slash commands (if applicable), use Discord's built-in command permissions management."
  );
  clearCacheValue("blocked-" + interaction.channel.id);
};
