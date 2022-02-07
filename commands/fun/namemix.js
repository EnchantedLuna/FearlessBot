exports.run = function (message, args, bot, db) {
  db.query(
    "SELECT CONCAT((SELECT name_piece FROM namemix WHERE part=1 ORDER BY RAND() LIMIT 1), " +
      "(SELECT name_piece FROM namemix WHERE part=2 ORDER BY RAND() LIMIT 1)) AS name",
    [],
    function (err, rows) {
      message.channel.send({
        embeds: [{ title: "Name Mix", description: rows[0].name }],
      });
    }
  );
};
