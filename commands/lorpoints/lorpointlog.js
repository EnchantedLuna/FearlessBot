const { findMember, escapeText } = require("../../util");

async function getLorpointEvents(db, guildId, memberId) {
  const [rows] = await db
    .promise()
    .query(
      "SELECT * FROM lorpoint_log WHERE guild = ? AND user = ? ORDER BY id DESC LIMIT 10",
      [guildId, memberId]
    );
  return rows;
}

function getEmbed(member, rows) {
  if (rows[0] != null) {
    let eventText = "";
    for (let i = 0; i < rows.length; i++) {
      const timestamp = rows[i].time.getTime() / 1000;
      const timestampString = "<t:" + timestamp + ":R>";
      const isCappedText = rows[i].is_capped ? " (capped)" : "";
      const pointText =
        rows[i].amount +
        " point" +
        (Math.abs(rows[i].amount) != 1 ? "s" : "") +
        isCappedText;
      eventText +=
        "* " +
        pointText +
        ": " +
        (rows[i].description ?? "*no description*") +
        " [" +
        timestampString +
        "]\n";
    }
    return [
      {
        title: ":star: Lorpoint History for " + escapeText(member.displayName),
        description: eventText,
      },
    ];
  } else {
    return [
      {
        title: "Lorpoint History for " + escapeText(member.displayName),
        description: "none :frowning: ",
      },
    ];
  }
}

exports.interaction = async function (interaction, bot, db) {
  let member = interaction.options.getMember("member");
  if (!member) {
    member = interaction.member;
  }
  const awards = await getLorpointEvents(db, interaction.guild.id, member.id);
  interaction.reply({ embeds: getEmbed(member, awards) });
};
