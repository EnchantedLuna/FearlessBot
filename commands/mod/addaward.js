const { isMod } = require("../../util");

exports.interaction = function (interaction, bot, db) {
  if (!isMod(interaction.member, interaction.guild)) {
    interaction.reply({ content: ":no_entry: You do not have permission to use this command.", ephemeral: true });
    return;
  }
  const member = interaction.options.getMember("member");
  const awardText = interaction.options.getString("text");
  db.query(
    "INSERT INTO awards (server, member, award, date) VALUES (?, ?, ?,CURDATE())",
    [interaction.guild.id, member.id, awardText]
  );
  interaction.reply(":trophy: Award have been added.");
};
