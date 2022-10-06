const config = require("../../config.json");
const { findMember } = require("../../util");

async function getStats(db, guild, member) {
  const [rows] = await db
    .promise()
    .query(
      "SELECT name, SUM(message_count) AS count FROM user_message_stats ums \
  JOIN channel_stats cs ON ums.guild=cs.server AND ums.channel=cs.channel \
  WHERE ums.guild = ? AND user = ? AND web=1 GROUP BY name ORDER BY count DESC",
      [guild, member]
    );
  let stats = "Messages by channel:\n";
  if (rows.length === 0) {
    stats += "(none)\n";
  }
  for (let row of rows) {
    const line = row.name + " - " + row.count + "\n";
    stats += line;
  }
  stats += "Chart and monthly stats: " + getStatsLink(guild, member);

  return stats;
}

function getStatsLink(guild, member) {
  return (
    config.baseUrl + "activityreport.php?server=" + guild + "&user=" + member
  );
}

exports.run = async function (message, args, bot, db) {
  const member = await findMember(message, args, bot);
  const description = await getStats(db, message.channel.guild.id, member.id);
  message.channel.send({
    embeds: [
      {
        title: "Activity Report for " + member.displayName,
        description: description,
      },
    ],
  });
};

exports.interaction = async function (interaction, bot, db) {
  let member = interaction.options.getMember("member");
  if (!member) {
    member = interaction.member;
  }

  const description = await getStats(db, interaction.guild.id, member.id);
  interaction.reply({
    embeds: [
      {
        title: "Activity Report for " + member.displayName,
        description: description,
      },
    ],
  });
};
