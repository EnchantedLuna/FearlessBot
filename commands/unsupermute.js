exports.run = function (message, args, bot, db) {
  let supermute = message.channel.guild.roles.cache.find(
    (role) => role.name === "supermute"
  );
  if (!supermute) {
    message.channel.send(":no_entry: Supermute role not found.");
  }
  message.mentions.members.forEach(function (member, key, map) {
    member.roles.remove(supermute);
    db.query(
      "UPDATE scheduled_actions SET completed=1 WHERE guild = ? AND user = ? AND action='unmute'",
      [message.channel.guild.id, member.id]
    );
    message.channel.send(member.user.tag + " has been un-supermuted.");
  });
};
