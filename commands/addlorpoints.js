const { log } = require("../util");

exports.run = function (message, args, bot, db) {
  let pieces = args.split(" ");
  let number = parseInt(pieces[0]);
  let list = [];

  if (isNaN(number)) {
    message.channel.send("", {
      embed: {
        description:
          ":x: You must enter a valid number of lorpoints to award.\nUsage: ``!award [number] @user1 @user2``",
        color: 0xff0000,
      },
    });
    return;
  }

  if (message.mentions.members.size === 0) {
    message.channel.send("", {
      embed: {
        description: ":x: You must mention a member to award lorpoints to.",
        color: 0xff0000,
      },
    });
    return;
  }

  message.mentions.members.forEach(function (member, key, map) {
    db.query(
      "UPDATE members SET lorpoints=lorpoints+? WHERE server = ? AND id = ?",
      [number, message.channel.guild.id, member.id]
    );
    list.push(member.user.username);
  });
  let finalList = list.join(", ");
  let lorpointWord = number !== 1 ? "lorpoints" : "lorpoint";
  message.channel.send("", {
    embed: {
      title: ":star: Adding Lorpoints",
      description:
        number + " " + lorpointWord + " have been added to:\n" + finalList,
      color: 0xdbe07e,
    },
  });
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
