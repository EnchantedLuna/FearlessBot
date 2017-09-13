const config = require("./auth.json");
const Discord = require("discord.js");
const mysql = require("mysql");
const staticData = require("./staticData.json");

// Command scripts
require("./commands/basic.js");
require("./commands/saveditems.js");
require("./commands/guildproperties.js");
require("./commands/database.js");
require("./commands/botadmin.js");

var bot = new Discord.Client();

var db = mysql.createConnection({
    host: config.mysqlHost,
    user: config.mysqlUser,
    password: config.mysqlPass,
    database: config.mysqlDB,
    charset: "utf8mb4"
});

bot.on('ready', () => {
    console.log('FearlessBot2 is ready.');
});

bot.on('message', message => {
    var text = message.content
    var command = message.content.split(" ");
    var params = command.slice(1, command.length).join(" ");

    updateUserStats(message);
    updateChannelStatsAndLog(message);

    switch (command[0].toLowerCase()) {
        // Normal user basic commands (no db)
        case "!8ball":
            eightBallCommand(message);
        break;
        case "!choose":
            chooseCommand(message, params);
        break;
        case "!song":
            songCommand(message);
        break;
        case "!album":
            albumCommand(message);
        break;
        case "!version":
            botVersionCommand(message);
        break;
        case "!n":
            nCommand(message, params);
        break;

        case "!region":
        case "!setregion":
        break;

        // Normal user database commands
        case "!channelstats":
            channelStatsCommand(message);
        break;
        case "!g":
        case "!get":
            getCommand(message, command[1], false);
        break;
        case "!getlist":
            getlistCommand(message);
        break;
        case "!save":
            saveCommand(message);
        break;
        case "!seen":
        break;
        case "!last":
        break;
        case "!words":
        break;
        case "!rankwords":
        break;
        case "!shitpost":
            shitpostCommand(message, command[1]);
        break;
        case "!name":
        break;
        case "!randmember":
            randomMemberCommand(message, command[1]);
        break;
        case "!activity":
        break;
        case "!poop":
            poopCommand(message);
        break;
        case "!rankpoop":
        break;

        // Mod commands
        case "!approve":
            if (isMod(message.member)) {
                approveCommand(message, command[1]);
            }
        break;
        case "!review":
            if (isMod(message.member)) {
                getCommand(message, command[1], true);
            }
        break;
        case "!delete":
            if (isMod(message.member)) {
                deleteCommand(message, command[1]);
            }
        break;
        case "!getunapproved":
        if (isMod(message.member)) {
            getUnapprovedCommand(message);
        }
        break;
        case "!topic":
            if (isMod(message.member)) {
                topicCommand(message, params);
            }
        break;
        case "!mute":
        break;
        case "!unmute":
        break;
        case "!addshitpost":
            if (isMod(message.member)) {
                addShitpostCommand(message, params);
            }
        break;

        // Bot admin commands
        case "!fbotrestart":
            if (message.author.id == config.botAdminUserId) {
                process.exit(-1);
            }
        break;
        case "!fsay":
            if (message.author.id == config.botAdminUserId) {
                fsayCommand(message, params);
            }
        break;
  }
});

bot.login(config.token);

function updateUserStats(message)
{
    var words = message.content.replace(/\s\s+|\r?\n|\r/g, ' ').split(" ").length;
    if (channelCountsInStatistics(message.channel.guild.id, message.channel.id)) {
        db.query("INSERT INTO members (server, id, username, discriminator, lastseen, words, messages) VALUES (?,?,?,?,UNIX_TIMESTAMP(),?,1)" +
            "ON DUPLICATE KEY UPDATE username=?, discriminator=?, lastseen=UNIX_TIMESTAMP(), words=words+?, messages=messages+1, active=1",
            [message.channel.guild.id, message.author.id, message.author.username, message.author.discriminator,
                 words, message.author.username, message.author.discriminator, words]);
    } else {
        db.query("INSERT INTO members (server, id, username, discriminator, lastseen) VALUES (?,?,?,?,UNIX_TIMESTAMP())" +
            "ON DUPLICATE KEY UPDATE username=?, discriminator=?, lastseen=UNIX_TIMESTAMP(), active=1",
            [message.channel.guild.id, message.author.id, message.author.username,
                message.author.discriminator, message.author.username, message.author.discriminator]);
    }
}

function updateChannelStatsAndLog(message)
{
    db.query(
        'INSERT INTO channel_stats (channel, server, total_messages, name, web, startdate) VALUES (?,?,1,?,0,UNIX_TIMESTAMP()) ' +
        'ON DUPLICATE KEY UPDATE total_messages=total_messages+1',
        [message.channel.id, message.channel.guild.id, message.channel.name]
    );

    db.query("INSERT INTO messages (discord_id, date, server, channel, message, author) VALUES (?,now(),?,?,?,?)",
     [message.id, message.channel.guild.id, message.channel.id, message.cleanContent, message.author.id]);
}

function channelCountsInStatistics(guild, channel)
{
    return (guild != config.mainServer || config.statCountingChannels.includes(channel));
}

function isMod(member)
{
    return member.roles.has(config.modRole);
}

function log(guild, message)
{
    var logChannel = guild.channels.find('name', 'log');
    if (logChannel) {
        logChannel.send(message);
    }
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};
