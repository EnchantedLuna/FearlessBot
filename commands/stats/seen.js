exports.run = function (message, params, bot, db) {
  if (message.mentions.members.size > 0) {
    member = message.mentions.members.first().user.username;
  } else {
    member = params;
  }

  if (member == message.author.username) {
    message.channel.send("", {
      embed: {
        title: member,
        description: ":thinking: Look in a mirror!",
      },
    });
  } else {
    db.query(
      "SELECT username, discriminator, lastseen, active FROM members WHERE server = ? AND username = ? ORDER BY messages DESC LIMIT 1",
      [message.channel.guild.id, member],
      function (err, rows) {
        if (rows[0] == null) {
          message.channel.send("", {
            embed: {
              title: member,
              description:
                ":warning: User not found. Please double check the username.",
            },
          });
        } else {
          let seconds = Math.floor(new Date() / 1000) - rows[0].lastseen;
          let date = new Date(rows[0].lastseen * 1000);
          let leftServerText = rows[0].active
            ? ""
            : "\nThis user has left the server.";
          message.channel.send("", {
            embed: {
              title: member,
              description:
                ":clock2: " +
                rows[0].username +
                "#" +
                rows[0].discriminator +
                " was last seen " +
                secondsToTime(seconds, false) +
                "ago. (" +
                date.toDateString() +
                ")" +
                leftServerText,
            },
          });
        }
      }
    );
  }
};

function secondsToTime(seconds, short) {
  var sec = seconds % 60;
  var minutes = Math.floor(seconds / 60) % 60;
  var hours = Math.floor(seconds / 3600) % 24;
  var days = Math.floor(seconds / 86400);

  var result = "";
  if (days > 0) {
    result += days + (short ? "d" : " day");
    if (!short) {
      result += days != 1 ? "s " : " ";
    }
  }
  if (hours > 0) {
    result += hours + (short ? "h" : " hour");
    if (!short) {
      result += hours != 1 ? "s " : " ";
    }
  }
  if (minutes > 0) {
    result += minutes + (short ? "m" : " minute");
    if (!short) {
      result += minutes > 1 ? "s " : " ";
    }
  }
  if (sec > 0) {
    result += sec + (short ? "s" : " second");
    if (!short) {
      result += sec != 1 ? "s " : " ";
    }
  }
  return result;
}
