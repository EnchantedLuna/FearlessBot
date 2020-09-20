const { log } = require("../util");
const pointsPerEvent = 2;
const eventCap = 4;

exports.run = function (message, args, bot, db) {
  if (message.mentions.members.size === 0) {
    message.channel.send("", {
      embed: {
        description: ":x: You must mention a member to add lorpoints to.",
        color: 0xff0000,
      },
    });
    return;
  }

  const memberList = Array.from(message.mentions.members.keys());

  let list = [];
  let cappedList = [];
  db.query(
    "SELECT id, server, username, lorpoints, eventpoints FROM members WHERE server = ? AND id IN (?)",
    [message.channel.guild.id, memberList],
    function (err, rows) {
      if (err) {
        console.log(err);
        return;
      }
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].eventpoints >= eventCap) {
          cappedList.push(rows[i].username);
        } else {
          let count = rows[i].eventpoints + 1;
          db.query(
            "UPDATE members SET lorpoints=lorpoints+?, eventpoints=eventpoints+1 WHERE server = ? AND id = ?",
            [pointsPerEvent, rows[i].server, rows[i].id]
          );
          list.push(rows[i].username + " (" + count + ")");
        }
      }

      let finalList = list.join(", ");
      let finalCappedList = cappedList.join(", ");
      let resultMessage = "";
      if (list.length > 0) {
        resultMessage +=
          pointsPerEvent +
          " lorpoints have been added to:\n" +
          finalList +
          "\n";
        log(
          message.channel.guild,
          pointsPerEvent +
            " lorpoints have been awarded to: " +
            finalList +
            " by " +
            message.author.username +
            " (included in cap)"
        );
      }
      if (cappedList.length > 0) {
        resultMessage +=
          "These members have reached their event limit:\n" + finalCappedList;
      }
      message.channel.send("", {
        embed: {
          title: ":star: Adding Capped Lorpoints",
          description: resultMessage,
          color: 0xdbe07e,
        },
      });
    }
  );
};
