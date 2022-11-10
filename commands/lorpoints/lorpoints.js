const { findMemberID } = require("../../util");
const config = require("../../config.json");
const { MessageEmbed } = require("discord.js");

function getEmbed(row, rank) {
  const lifetime = row["lifetime_lorpoints"] + row["lorpoints"];
  return [
    new MessageEmbed()
      .setTitle(":star: Lorpoints")
      .setDescription(
        row.username +
          " has " +
          row.lorpoints +
          " lorpoints.\nCurrent Rank: " +
          rank +
          getSuffix(rank) +
          "\nCapped events this week: " +
          row.eventpoints +
          "/" +
          config.eventCap +
          "\nLifetime lorpoints: " +
          lifetime
      ),
  ];
}

exports.run = function (message, args, bot, db) {
  const member = findMemberID(message, args, bot);

  db.query(
    "SELECT username, lorpoints, eventpoints, lifetime_lorpoints FROM members WHERE server = ? AND id = ?",
    [message.channel.guild.id, member],
    function (err, rows) {
      if (err) {
        console.error("lorpoint command db error: " + err);
        return;
      }
      if (rows[0] !== null) {
        db.query(
          "SELECT COUNT(*) AS higher FROM members WHERE server = ? AND lorpoints > ?",
          [message.channel.guild.id, rows[0].lorpoints],
          function (err, totals) {
            const rank = totals[0].higher + 1;
            message.channel.send({
              embeds: getEmbed(rows[0], rank),
            });
          }
        );
      }
    }
  );
};

exports.interaction = function (interaction, bot, db) {
  let member = interaction.options.getMember("member");
  if (!member) {
    member = interaction.member;
  }

  db.query(
    "SELECT username, lorpoints, eventpoints, lifetime_lorpoints FROM members WHERE server = ? AND id = ?",
    [interaction.guild.id, member.id],
    function (err, rows) {
      if (err) {
        console.error("lorpoint command db error: " + err);
        return;
      }
      if (rows[0] !== null) {
        db.query(
          "SELECT COUNT(*) AS higher FROM members WHERE server = ? AND lorpoints > ?",
          [interaction.guild.id, rows[0].lorpoints],
          function (err, totals) {
            const rank = totals[0].higher + 1;
            interaction.reply({
              embeds: getEmbed(rows[0], rank),
            });
          }
        );
      }
    }
  );
};

function getSuffix(number) {
  const lastDigit = number % 10;
  if (lastDigit === 1 && number % 100 !== 11) {
    return "st";
  } else if (lastDigit === 2 && number % 100 !== 12) {
    return "nd";
  } else if (lastDigit === 3 && number % 100 !== 13) {
    return "rd";
  }
  return "th";
}
