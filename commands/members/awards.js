const { findMember, escapeText } = require("../../util");

async function getAwards(db, guildId, memberId) {
  const [rows] = await db
    .promise()
    .query(
      "SELECT * FROM awards WHERE server = ? AND member = ? ORDER BY date, id",
      [guildId, memberId]
    );
  return rows;
}

function getEmbed(member, rows) {
  if (rows[0] != null) {
    let awardsText = "";
    for (let i = 0; i < rows.length; i++) {
      let date = rows[i].date.toDateString();
      awardsText += i + 1 + ". " + rows[i].award + " [" + date + "]\n";
    }
    return [
      {
        title: ":trophy: Awards for " + escapeText(member.displayName),
        description: awardsText,
      },
    ];
  } else {
    return [
      {
        title: "Awards for " + escapeText(member.displayName),
        description: "none :frowning: ",
      },
    ];
  }
}

exports.run = async function (message, args, bot, db) {
  const member = await findMember(message, args, bot);
  const awards = await getAwards(db, message.channel.guild.id, member.id);
  message.channel.send({ embeds: getEmbed(member, awards) });
};

exports.interaction = async function (interaction, bot, db) {
  let member = interaction.options.getMember("member");
  if (!member) {
    member = interaction.member;
  }
  const awards = await getAwards(db, interaction.guild.id, member.id);
  interaction.reply({ embeds: getEmbed(member, awards) });
};
