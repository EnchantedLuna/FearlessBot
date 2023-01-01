const { clearCacheValue } = require("../../util");

exports.interaction = function (interaction, bot, db) {
  const value = interaction.options.getInteger("value");
  db.query(
    "UPDATE channel_stats SET is_spam=? WHERE server = ? AND channel = ?",
    [value, interaction.guild.id, interaction.channel.id]
  );
  interaction.reply("Spam status has been updated.");
  clearCacheValue("spam-" + interaction.channel.id);
};
