const { log } = require("../../util");

exports.run = function (message, args, bot, db) {
  let pieces = args.split(" ");
  let number = parseInt(pieces[0]);
  let list = [];

  if (isNaN(number)) {
    message.channel.send("", {
      embed: {
        description:
          ":x: You must enter a valid number of lorpoints to add.\nUsage: ``!alp [number] @user1 @user2``",
        color: 0xff0000,
      },
    });
    return;
  }

  if (number > 1000000 || number < -10000000) {
    message.channel.send("", {
      embed: {
        description: ":x: This amount is too high!",
        color: 0xff0000,
      },
    });
    return;
  }

  if (message.mentions.members.size === 0) {
    message.channel.send("", {
      embed: {
        description: ":x: You must mention a member to add lorpoints to.",
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
  let userCount = list.length;
  let lorpointWord = number !== 1 ? "lorpoints" : "lorpoint";
  message.channel.send("", {
    embed: {
      title: ":star: Adding Lorpoints",
      description:
        number + " " + lorpointWord + " have been added to:\n" + finalList,
        footer: {text: 'Total users: ' + userCount},
      color: 0xdbe07e,
    },
  });
  if (number != 0) {
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
  }
};
