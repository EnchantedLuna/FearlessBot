exports.interaction = function (interaction, bot, db) {
  db.query("UPDATE members SET eventpoints=0 WHERE server=?", [
    interaction.guild.id,
  ]);
  interaction.reply("Event caps have been reset.");
};
