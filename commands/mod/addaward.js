exports.interaction = function (interaction, bot, db) {
  const member = interaction.options.getMember("member");
  const awardText = interaction.options.getString("text");
  db.query(
    "INSERT INTO awards (server, member, award, date) VALUES (?, ?, ?,CURDATE())",
    [interaction.guild.id, member.id, awardText]
  );
  interaction.reply(":trophy: Award have been added.");
};
