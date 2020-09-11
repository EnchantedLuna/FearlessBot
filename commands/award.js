const { log } = require("../util");

exports.run = function (message, args, bot, db) {
  let pieces = args.split(" ");
  let number = parseInt(pieces[0]);
  let list = [];
  message.mentions.members.forEach(function (member, key, map) {
    db.query(
      "UPDATE members SET lorpoints=lorpoints+? WHERE server = ? AND id = ?",
      [number, message.channel.guild.id, member.id]
    );
    list.push(member.user.username);
  });
  let finalList = list.join(", ");
  let lorpointWord = number !== 1 ? "lorpoints" : "lorpoint";
  message.channel.send(
    number + " " + lorpointWord + " have been awarded to: " + finalList
  );
  log(
    message.channel.guild,
    number +
      " " +
      lorpointWord +
      " have been awarded to: " +
      finalList +
      " by " +
      message.author.username
  );
};
