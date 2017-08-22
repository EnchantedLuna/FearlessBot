const config = require("./auth.json");
const Discord = require("discord.js");
const mysql = require("mysql");
const staticData = require("./staticData.json");
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

        case "!region":
        case "!setregion":
        break;

        // Normal user database commands
        case "!channelstats":
            channelstatsCommand(message);
        break;
        case "!g":
        case "!get":
            getCommand(message, command[1], false);
        break;
        case "!getlist":
            getlistCommand(message);
        break;
        case "!save":
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
        break;
        case "!activity":
        break;

        // Mod commands
        case "!approve":
        break;
        case "!review":
        break;
        case "!delete":
        break;
        case "!getunapproved":
        break;
        case "!topic":
        break;
        case "!mute":
        break;
        case "!unmute":
        break;
        case "!addshitpost":
        break;

        // Bot admin commands
        case "!fbotrestart":
        break;
        case "!fsay":
        break;
  }
});

bot.login(config.token);


function eightBallCommand(message)
{
    var answer = staticData.eightBallAnswers[Math.floor(Math.random() * staticData.eightBallAnswers.length)];
    message.reply(answer);
}

function botVersionCommand(message)
{
    message.reply("running version: " + staticData.version);
}

function chooseCommand(message, params)
{
    var choices = params.split(",");
    if (choices.length > 1) {
        var selectedChoice = choices[Math.floor(Math.random() * choices.length)];
        message.reply("I pick: " + selectedChoice.trim());
    }
}

function songCommand(message)
{
    var answer = staticData.taylorSwiftSongs[Math.floor(Math.random() * staticData.taylorSwiftSongs.length)];
    message.reply('you should listen to ' + answer + '.');
}

function albumCommand(message)
{
    var answer = staticData.taylorSwiftAlbums[Math.floor(Math.random() * staticData.taylorSwiftAlbums.length)];
    message.reply('you should listen to ' + answer + '.');
}


function getCommand(message, keyword, showUnapproved)
{
    if (keyword == null)
        return;
    db.query("SELECT * FROM data_store WHERE server = ? AND keyword = ?", [message.channel.guild.id, keyword], function (err, rows) {
        if (rows[0] == null) {
            message.reply("nothing is stored for keyword " + keyword + ".");
        } else if (!rows[0].approved && !showUnapproved) {
            message.reply("this item has not been approved yet.");
        } else {
            message.reply(rows[0]['value']);
            if (channelCountsInStatistics(message.channel.guild.id, message.channel.id)) {
                db.query("UPDATE data_store SET uses=uses+1, lastused=now() WHERE keyword = ? AND server = ?", [keyword, message.channel.guild.id]);
            }
        }
    });
}

function getlistCommand(message)
{
    message.reply("https://tay.rocks/fearlessdata.php?server=" + message.channel.guild.id);
}

function saveCommand()
{

}

function channelstatsCommand(message)
{
    db.query("SELECT * FROM channel_stats WHERE channel = ?", [message.channel.id], function (err, rows)
    {
        var total = rows[0].total_messages;
        var startdate = new Date(rows[0].startdate*1000);
        message.reply("there have been " + total + " messages sent since "+ startdate.toDateString() +" in this channel.");
    });
}

function shitpostCommand(message, number)
{
    var number = parseInt(number, 10);
    if (number > 0) {
        db.query("SELECT id, shitpost FROM shitposts WHERE id=?", [number], function (err, rows) {
            if (rows != null) {
                message.reply(rows[0].shitpost + " (#"+rows[0].id+")");
            }
        });
    } else {
        db.query("SELECT id, shitpost FROM shitposts ORDER BY RAND() LIMIT 1", [], function (err, rows) {
            if (rows != null) {
                message.reply(rows[0].shitpost + " (#"+rows[0].id+")");
            }
        });
    }
}

function channelCountsInStatistics(guild, channel)
{
    return (guild != config.mainServer || config.statCountingChannels.includes(channel));
}
