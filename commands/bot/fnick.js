exports.run = function (message, args, bot, db) {
  void message.channel.guild.members.me.setNickname(args.toString());
  message.channel.send("Nickname changed!");
};
