const { log, getGuildConfig } = require("../../util");
const config = require("../../config.json");
const { EmbedBuilder } = require("discord.js");

exports.run = async function (message, args, bot, db) {
  const eventCap = await getGuildConfig(
    message.channel.guild.id,
    "lorpoint-cap",
    db
  );
  const pointsPerEvent = await getGuildConfig(
    message.channel.guild.id,
    "event-lorpoints",
    db
  );

  if (message.mentions.members.size === 0) {
    message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setDescription(":x: You must mention a member to add lorpoints to.")
          .setColor(0xff0000),
      ],
    });
    return;
  }

  const memberList = Array.from(message.mentions.members.keys());

  let list = [];
  let cappedList = [];
  db.query(
    "SELECT id, server, username, lorpoints, eventpoints FROM members WHERE server = ? AND id IN (?) ORDER BY username",
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
      message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(":star: Adding Capped Lorpoints")
            .setDescription(resultMessage.toString())
            .setColor(0xdbe07e)
            .setFooter({
              text: `Number in parentheses indicates events attended this cycle. Current cap is ${eventCap}`,
            }),
        ],
      });
    }
  );
};
