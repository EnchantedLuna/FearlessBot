const { findMember } = require("../../util");

function getEmbed(member, rows) {
  if (rows[0] != null) {
    let awardsText = "";
    for (let i = 0; i < rows.length; i++) {
      let date = rows[i].date.toDateString();
      awardsText += i + 1 + ". " + rows[i].award + " [" + date + "]\n";
    }
    return [{
      title: ":trophy: Awards for " + member.displayName,
      description: awardsText,
    }];
  } else {
    return [{
      title: "Awards for " + member.displayName,
      description: "none :frowning: ",
    }];
  }
}

exports.run = async function (message, args, bot, db) {
  const member = await findMember(message, args, bot);

  db.query(
    "SELECT * FROM awards WHERE server = ? AND member = ? ORDER BY date, id",
    [message.channel.guild.id, member.id],
    function (err, rows) {
      if (err != null) {
        console.log(err);
        return;
      }
      message.channel.send({embeds: getEmbed(member, rows)});
    }
  );
}

exports.interaction = function(interaction, bot, db) {
  let member = interaction.options.getMember("member");
  if (!member) {
    member = interaction.member;
  }

  db.query(
    "SELECT * FROM awards WHERE server = ? AND member = ? ORDER BY date, id",
    [interaction.guild.id, member.id],
    function (err, rows) {
      if (err != null) {
        console.log(err);
        return;
      }
      interaction.reply({embeds: getEmbed(member, rows)});
    }
  );
}