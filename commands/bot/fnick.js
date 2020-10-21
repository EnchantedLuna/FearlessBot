exports.run = function(message, args, bot, db)
{
    message.channel.guild.me.setNickname(args);
    message.channel.send("Nickname changed!");
}