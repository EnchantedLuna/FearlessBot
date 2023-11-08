exports.run = function (message, args, bot, db) {
  message.channel.send(
    ":warning: This command must be used through the slash command /addaward"
  );
};

exports.interaction = function (interaction, bot, db) {
  const member = interaction.options.getMember("member");
  const awardText = interaction.options.getString("text");
  db.query(
    "INSERT INTO awards (server, member, award, date) VALUES (?, ?, ?,CURDATE())",
    [interaction.guild.id, member.id, awardText]
  );
  interaction.reply(":trophy: Award have been added.");
};
