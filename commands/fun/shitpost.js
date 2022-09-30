async function getShitpost(db, id) {
  let rows;
  if (id > 0) {
    [rows] = await db
      .promise()
      .query("SELECT id, shitpost FROM shitposts WHERE id=?", [id]);
  } else {
    [rows] = await db
      .promise()
      .query("SELECT id, shitpost FROM shitposts ORDER BY RAND() LIMIT 1", []);
  }
  if (!rows[0]) {
    return ":warning: That shitpost doesn't exist!";
  }

  return rows[0].shitpost + " (#" + rows[0].id + ")";
}

exports.run = async function (message, params, bot, db) {
  const shitpost = await getShitpost(db, parseInt(params, 10));
  message.channel.send(shitpost);
};

exports.interaction = async function (interaction, bot, db) {
  const number = interaction.options.getInteger("id") ?? 0;
  const shitpost = await getShitpost(db, number);
  interaction.reply(shitpost);
};
