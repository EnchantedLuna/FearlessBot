exports.run = function (message, args, bot, db) {
  const argList = args.split("|");
  if (message.mentions.members.size === 0 || argList[1] == null) {
    message.channel.send(
      ":warning: Usage: ``!addaward @user1 @user2 | Award text``"
    );
    return;
  }
  const awardText = argList[1].trim();
  message.mentions.members.forEach(function (member, key, map) {
    db.query(
      "INSERT INTO awards (server, member, award, date) VALUES (?, ?, ?,CURDATE())",
      [message.channel.guild.id, member.id, awardText]
    );
  });
  message.channel.send(":trophy: Awards have been added.");
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
