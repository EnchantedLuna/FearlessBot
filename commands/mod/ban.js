const { isMod, log } = require("../../util");

exports.run = function (message, args, bot, db) {
  const argSet = args.split(" ");
  const days = parseInt(argSet[0]);
  message.mentions.members.forEach(function (member, key, map) {
    if (isMod(member, message.channel.guild)) {
      message.channel.send(":smirk:");
      return;
    }
    if (!member.bannable) {
      message.channel.send({
        embeds: [
          {
            description:
              ":warning: I don't have permission to ban that member.",
          },
        ],
      });
      return;
    }
    let reason = message.cleanContent.replace("!ban ", "");
    member.ban({ reason: reason });
    message.channel.send({
      embeds: [
        {
          description:
            ":hammer: " +
            member.user.username +
            "#" +
            member.user.discriminator +
            " (" +
            member.user.id +
            ")" +
            " has been banned.",
        },
      ],
    });
    let timeMessage = "indefinitely";
    if (days > 0) {
      db.query(
        "INSERT INTO scheduled_actions (action, guild, user, effectivetime) \
                  VALUES ('unban', ?, ?, NOW() + INTERVAL ? DAY)",
        [message.channel.guild.id, member.user.id, days]
      );
      timeMessage = "for " + days + " day";
      timeMessage += days !== 1 ? "s" : "";
    }
    log(
      message.channel.guild,
      member.user.username +
        "#" +
        member.user.discriminator +
        " (" +
        member.user.id +
        ")" +
        " has been banned " +
        timeMessage +
        " by " +
        message.author.username
    );
  });
};
