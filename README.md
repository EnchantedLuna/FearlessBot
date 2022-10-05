# FearlessBot

Bot for Discord that performs various useful operations using discord.js. This was designed for use in the /r/TaylorSwift discord server,
and as such contains code that is specific to the particular server.

## Prerequisites

- node.js
- discord.js https://github.com/hydrabolt/discord.js/
- mysql.js https://github.com/felixge/node-mysql

## Docker Setup

1. Copy config-sample.json to config.json and add in your bot token and other config values
2. Copy web/config-sample.php to web/config.php (if using the web components). Set PRIMARY_GUILD.
3. Run `docker-compose up`

If bot is successfully started, FearlessBot will print "FearlessBot (Taylor's Version) is ready" to console.
Web scripts are on port 8080 by default, e.g. http://localhost:8080/fearlessdata.php for saved items

## Manual setup

1. Create a MySQL/MariaDB database and run db.sql to initialize tables
2. Copy config-sample.json to config.json and add bot tokens and other config values
3. Make sure Node.js v16+ is installed
4. cd to the project directory and `npm install`
5. `node FearlessBot.js`
6. (Optional) for PHP scripts, paste the files in the web root of your preferred web server, copy config-sample.php to config.php and set values. The PHP code is very simplistic, so it should work with any modern version of PHP.
