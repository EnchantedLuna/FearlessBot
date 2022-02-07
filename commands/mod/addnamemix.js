exports.run = function (message, args, bot, db) {
  let pieces = args.split(" ");
  let part = parseInt(pieces[0]);
  let namePiece = pieces[1];

  if ((part !== 1 && part !== 2) || namePiece === null) {
    message.channel.send(
      "Invalid part. usage: ``!namemix [1,2] [name piece]``"
    );
    return;
  }

  db.query(
    "INSERT INTO namemix (name_piece, part, addedby, addedon) VALUES (?,?,?,now())",
    [namePiece, part, message.author.id]
  );
  message.channel.send("Name mix part added!");
};
