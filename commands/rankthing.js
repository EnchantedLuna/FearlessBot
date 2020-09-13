const Pagination = require("discord-paginationembed");

function buildEmbed(message, title, entries) {
  const FieldsEmbed = new Pagination.FieldsEmbed()
    .setArray(entries)
    .setAuthorizedUsers(message.author.id)
    .setChannel(message.channel)
    .setElementsPerPage(20)
    .setPageIndicator(false)
    .formatField("Users", (e) => e.user)
    .setDisabledNavigationEmojis(["jump", "delete"]);
  FieldsEmbed.embed.setColor(0x00ffff).setTitle(title);
  FieldsEmbed.build();
}

exports.run = function (message, page, bot, db, thing) {
  let entries = [];
  db.query(
    "SELECT username, " +
      thing +
      " AS thing FROM members WHERE server = ? AND " +
      thing +
      " > 0 AND active=1 ORDER BY " +
      thing +
      " DESC",
    [message.channel.guild.id],
    function (err, rows) {
      let count = 0;
      let rank = 0;
      let previousThing = null;
      rows.forEach(function (member) {
        count++;
        rank = member.thing === previousThing ? rank : count;
        previousThing = member.thing;
        entries.push({
          user:
            rank + ": " + member.username + " - " + member.thing + " " + thing,
        });
      });
      buildEmbed(message, "Ranking for " + thing, entries);
    }
  );
};
