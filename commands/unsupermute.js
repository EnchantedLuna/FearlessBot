exports.run = function (message) {
  let supermute = message.channel.guild.roles.cache.find(
    (role) => role.name === "supermute"
  );
  if (!supermute) {
    message.channel.send(":no_entry: Supermute role not found.");
  }
  message.mentions.members.forEach(function (member, key, map) {
    member.roles.remove(supermute);
    message.channel.send(member.user.tag + " has been un-supermuted.");
  });
};
