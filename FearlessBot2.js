var config = require("./auth.json");
var Discord = require("discord.js");
var mysql = require("mysql");
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

bot.login(config.token);
