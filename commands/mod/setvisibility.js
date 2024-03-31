exports.interaction = function (interaction, bot, db) {
  const value = interaction.options.getInteger("value");
  db.query("UPDATE channel_stats SET web=? WHERE server = ? AND channel = ?", [
    value,
    interaction.guild.id,
    interaction.channel.id,
  ]);
  interaction.reply(":eye: Channel stats visibility has been updated.");
};
