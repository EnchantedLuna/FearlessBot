const { isMod, log } = require("../util");

exports.run = function (message, args, bot, db) {
  let command = message.content.split(" ");
  if (command[1] == null) return;
  if (command[1].startsWith("http")) {
    message.channel.send(
      ":warning: You probably messed up your command. The keyword comes first!"
    );
    return;
  }
  if (command[2] == null) {
    message.channel.send(
      ":warning: You need to specify a value (the thing you want saved) for that keyword."
    );
    return;
  }

  let key = command[1];
  let value = command.slice(2, command.length).join(" ");
  db.query(
    "SELECT * FROM data_store WHERE server = ? AND keyword = ?",
    [message.channel.guild.id, key],
    function (err, rows) {
      if (
        isMod(message.member, message.channel.guild) &&
        (rows[0] == null || rows[0]["owner"] == message.author.id)
      ) {
        db.query(
          "REPLACE INTO data_store (server, keyword, value, owner, approved, timeadded, approvedby) VALUES (?,?,?,?,1,now(),?)",
          [
            message.channel.guild.id,
            key,
            value,
            message.author.id,
            message.author.id,
          ]
        );
        message.channel.send(
          ":white_check_mark: Saved item updated and ready to use."
        );
        log(
          message.channel.guild,
          message.author.username +
            " created item " +
            key +
            " - auto approved\nValue: " +
            value
        );
      } else if (rows[0] == null) {
        db.query(
          "INSERT INTO data_store (server, keyword, value, owner, timeadded) VALUES (?,?,?,?,now())",
          [message.channel.guild.id, key, value, message.author.id]
        );
        message.channel.send(
          ":ballot_box_with_check: Saved item created. This will need to be approved before it can be used."
        );
        log(
          message.channel.guild,
          message.author.username +
            " created item " +
            key +
            " - pending approval\nValue: " +
            value
        );
      } else if (rows[0]["owner"] == message.author.id) {
        db.query(
          "UPDATE data_store SET value = ?, approved=0, timeadded=now(), approvedby=null WHERE keyword = ? AND server = ?",
          [value, key, message.channel.guild.id]
        );
        message.channel.send(
          ":ballot_box_with_check: Saved item updated. This will need to be approved before it can be used."
        );
        log(
          message.channel.guild,
          message.author.username +
            " updated item " +
            key +
            " - pending approval\nValue: " +
            value
        );
      } else {
        message.channel.send(
          ":warning: Error saving: this keyword already exists."
        );
      }
    }
  );
};
