const { MessageEmbed } = require("discord.js");
exports.run = function (message, days, bot, db) {
  let dayLimit = parseInt(days, 10);
  if (!dayLimit) {
    dayLimit = 1;
  }
  const time = Math.floor(new Date() / 1000) - 86400 * dayLimit;
  db.query(
    "SELECT id FROM members WHERE server = ? AND lastseen > ? AND active=1 ORDER BY RAND() LIMIT 1",
    [message.channel.guild.id, time],
    function (err, rows) {
      if (rows != null) {
        const user = bot.users.cache.get(rows[0].id.toString())
        if (!user) {
          return;
        }
        const member = message.channel.guild.member(user);
        if (!member) {
          return;
        }
        const nickname = member.nickname ? member.nickname + "\n" : "";
        message.channel.send({
          embeds: [
              new MessageEmbed()
                  .setTitle(":game_die: Random Member")
                  .setDescription(`${nickname} + ${user.tag}`)
                  .setThumbnail(user.displayAvatarURL())
                  .setColor(member.displayColor)
          ]
        });
      }
    }
  );
};
