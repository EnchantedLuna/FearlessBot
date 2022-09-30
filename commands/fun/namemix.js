async function getMix(db) {
  const [rows] = await db
    .promise()
    .query(
      "SELECT CONCAT((SELECT name_piece FROM namemix WHERE part=1 ORDER BY RAND() LIMIT 1), " +
        "(SELECT name_piece FROM namemix WHERE part=2 ORDER BY RAND() LIMIT 1)) AS name",
      []
    );
  return rows[0].name;
}

exports.run = async function (message, args, bot, db) {
  const name = await getMix(db);
  message.channel.send({
    embeds: [{ title: "Name Mix", description: name }],
  });
};

exports.interaction = async function (interaction, bot, db) {
  const name = await getMix(db);
  interaction.reply({
    embeds: [{ title: "Name Mix", description: name }],
  });
};
