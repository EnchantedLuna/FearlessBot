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
3. Run docker-compose up

If bot is successfully started, FearlessBot will print "FearlessBot (Taylor's Version) is ready" to console.
Web scripts are on port 8080 by default, e.g. http://localhost:8080/fearlessdata.php for saved items
