exports.run = function (message, params, bot, db) {
    const number = parseInt(params, 10);
    if (number > 0) {
    db.query(
      "SELECT id, shitpost FROM shitposts WHERE id=?",
      [number],
      function (err, rows) {
        if (rows[0] != null) {
          message.channel.send(rows[0].shitpost + " (#" + rows[0].id + ")");
        } else {
          message.channel.send(":warning: That shitpost doesn't exist!");
        }
      }
    );
  } else {
    db.query(
      "SELECT id, shitpost FROM shitposts ORDER BY RAND() LIMIT 1",
      [],
      function (err, rows) {
        if (rows[0] != null) {
          message.channel.send(rows[0].shitpost + " (#" + rows[0].id + ")");
        }
      }
    );
  }
};

exports.interaction = function(interaction, bot, db) {
  const number = interaction.options.getInteger("id") ?? 0;
  if (number > 0) {
  db.query(
    "SELECT id, shitpost FROM shitposts WHERE id=?",
    [number],
    function (err, rows) {
      if (rows[0] != null) {
        interaction.reply(rows[0].shitpost + " (#" + rows[0].id + ")");
      } else {
        interaction.reply(":warning: That shitpost doesn't exist!");
      }
    }
  );
} else {
  db.query(
    "SELECT id, shitpost FROM shitposts ORDER BY RAND() LIMIT 1",
    [],
    function (err, rows) {
      if (rows[0] != null) {
        interaction.reply(rows[0].shitpost + " (#" + rows[0].id + ")");
      }
    }
  );
}
}