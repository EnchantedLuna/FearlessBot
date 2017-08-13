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
  var text = message.content;
  var command = message.content.split(" ");

  switch (command[0].toLowerCase()) {
    case "!8ball":
      roll8Ball(message);
    break;
  }
});

bot.login(config.token);


function roll8Ball(message)
{
  var answer = staticData.eightBallAnswers[Math.floor(Math.random() * staticData.eightBallAnswers.length)];
  message.reply(answer);
}
