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
    case "!8ball":
      eightBallCommand(message);
    break;
    case "!choose":
      chooseCommand(message, params);
    break;
    case "!version":
    botVersionCommand(message);
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
    if (choices.length > 1)
    {
        var selectedChoice = choices[Math.floor(Math.random() * choices.length)];
        message.reply("I pick: " + selectedChoice.trim());
    }
}
