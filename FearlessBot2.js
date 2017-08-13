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

        // Normal user database commands
        case "!g":
        case "!get":
            getCommand(message, command[1]);
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


function getCommand(message, keyword)
{
    if (keyword == null)
        return;
    db.query("SELECT * FROM data_store WHERE server = ? AND keyword = ?", [message.channel.guild.id, keyword], function (err, rows) {
        if (rows[0] == null) {
            message.reply("nothing is stored for keyword " + keyword + ".");
        } else if (!rows[0].approved) {
            message.reply("this item has not been approved yet.");
        } else {
            message.reply(rows[0]['value']);
            if (channelCountsInStatistics(message.channel.id)) {
                db.query("UPDATE data_store SET uses=uses+1, lastused=now() WHERE keyword = ? AND server = ?", [keyword, message.channel.guild.id]);
            }
        }
    });
}

function channelCountsInStatistics(channel)
{
    return false;
}
