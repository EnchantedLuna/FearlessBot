const { channelCountsInStatistics } = require("../util");

exports.run = function (message, keyword, bot, db, showUnapproved) {
  if (keyword == null) return;
  let author = message.author.tag;
  db.query(
    "SELECT * FROM data_store WHERE server = ? AND keyword = ?",
    [message.channel.guild.id, keyword],
    function (err, rows) {
      if (rows[0] == null) {
        message.channel.send("", {
          embed: {
            title: keyword + " (requested by " + author + ")",
            description:
              ":warning: Nothing is stored for keyword " + keyword + ".",
          },
        });
      } else if (!rows[0].approved && !showUnapproved) {
        message.channel.send("", {
          embed: {
            title: keyword + " (requested by " + author + ")",
            description: ":warning: This item has not been approved yet.",
          },
        });
      } else {
        let text = rows[0]["value"];
        if (text.match("^(http(s?):)([/|.|\\w|\\s|-])*\\.(?:jpg|gif|png)$")) {
          let date = "Created: ";
          if (rows[0].timeadded !== null) {
            date += rows[0].timeadded.toDateString();
          } else {
            date += "a long time ago";
          }
          message.channel.send("", {
            embed: {
              title: keyword + " (requested by " + author + ")",
              image: { url: text },
              footer: { text: date },
            },
          });
        } else {
          message.reply(text);
        }
        if (
          channelCountsInStatistics(
            message.channel.guild.id,
            message.channel.id
          )
        ) {
          db.query(
            "UPDATE data_store SET uses=uses+1, lastused=now() WHERE keyword = ? AND server = ?",
            [keyword, message.channel.guild.id]
          );
        }
      }
    }
  );
};