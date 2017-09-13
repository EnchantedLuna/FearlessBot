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
        case "!n":
            nCommand(message, params);
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
        break;
        case "!topic":
            if (isMod(message.member)) {
                topicCommand(message, params);
            }
        break;
        case "!mute":
        break;command
        case "!unmute":
        break;
        case "!addshitpost":
            if (isMod(message.member)) {
                addshitpostCommand(message, params);
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

function nCommand(message, params)
{
    var nenified = params.replaceAll('m','n').replaceAll('M','N');
    message.reply(nenified);
}


function getCommand(message, keyword, showUnapproved)
{
    if (keyword == null)
        return;
    db.query("SELECT * FROM data_store WHERE server = ? AND keyword = ?",
     [message.channel.guild.id, keyword], function (err, rows) {
        if (rows[0] == null) {
            message.reply("nothing is stored for keyword " + keyword + ".");
        } else if (!rows[0].approved && !showUnapproved) {
            message.reply("this item has not been approved yet.");
        } else {
            message.reply(rows[0]['value']);
            if (channelCountsInStatistics(message.channel.guild.id, message.channel.id)) {
                db.query("UPDATE data_store SET uses=uses+1, lastused=now() WHERE keyword = ? AND server = ?",
                 [keyword, message.channel.guild.id]);
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

function approveCommand(message, keyword)
{
    db.query("UPDATE data_store SET  approved=1 WHERE keyword = ? AND server = ?",
    [keyword, message.channel.guild.id], function (err, result) {
        if (result.changedRows  > 0) {
            message.reply("approved.");
            log(message.channel.guild, "Saved item " + keyword + " has been approved by "
            + message.author.username);
        } else {
            message.reply("nothing to approve.");
        }
    });
}

function deleteCommand(message, keyword)
{
    if (isMod(message.member)) {
        db.query("DELETE FROM data_store WHERE server = ? AND keyword = ?",
        [message.channel.guild.id, keyword], function (err, result) {
            if (result.affectedRows > 0) {
                message.reply("deleted.");
                log(message.channel.guild, "Saved item " + keyword + " has been deleted by " + message.author.username);
            } else {
                message.reply("keyword not found.");
            }
        });
    }
}

function channelstatsCommand(message)
{
    db.query("SELECT * FROM channel_stats WHERE channel = ?", [message.channel.id], function (err, rows)
    {
        var total = rows[0].total_messages;
        var startdate = new Date(rows[0].startdate*1000);
        message.reply("there have been " + total + " messages sent since " + startdate.toDateString() + " in this channel.");
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

function addshitpostCommand(message, shitpost)
{
    db.query("INSERT INTO shitposts (shitpost, addedby, addedon) VALUES (?,?,now())",
    [shitpost, message.author.id], function (err, result) {
        message.reply("added #"+result.insertId+".");
    });
}

function topicCommand(message, topic)
{
    message.channel.setTopic(topic, "Set by " + message.author.username);
    log(message.channel.guild, "Topic in " + message.channel.name + " has been changed by "
    + message.author.username + " to " + topic );
    message.reply("topic updaed.");
}

function fsayCommand(message, params)
{
    message.channel.send(params);
    message.delete();
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
