exports.run = function (message, params, bot, db) {
  var number = parseInt(params, 10);
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
