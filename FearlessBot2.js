const config = require("./auth.json");
const Discord = require("discord.js");
const mysql = require("mysql");
const staticData = require("./staticData.json");

var bot = new Discord.Client({ "disableEveryone" : true, "fetchAllMembers" : true});

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
    if (message.channel.type != 'text') {
        return;
    }

    var text = message.content
    var command = message.content.split(" ");
    var params = command.slice(1, command.length).join(" ");

    updateUserStats(message);
    updateChannelStatsAndLog(message);

    if (config.noCommandChannels.includes(message.channel.id)) {
        return;
    }

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
            regionCommand(message, command[1]);
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
            seenCommand(message, params);
            break;
        case "!last":
            lastCommand(message, params, false);
            break;
        case "!olast":
            lastComand(message, params, true);
            break;
        case "!words":
            wordsCommand(message, params);
            break;
        case "!rankwords":
            rankThingCommand(message, "words", parseInt(command[1]));
            break;
        case "!shitpost":
            shitpostCommand(message, command[1]);
            break;
        case "!name":
            nameCommand(message, command);
            break;
        case "!randmember":
            randomMemberCommand(message, command[1]);
            break;
        case "!activity":
            activityCommand(message);
            break;
        case "!poop":
            poopCommand(message);
            break;
        case "!rankpoop":
            rankThingCommand(message, "poops", parseInt(command[1]));
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
            if (isMod(message.member)) {
                muteCommand(message);
            }
            break;
        case "!unmute":
            if (isMod(message.member)) {
                unmuteCommand(message);
            }
            break;
        case "!supermute":
            if (isMod(message.member)) {
                supermuteCommand(message);
            }
            break;
        case "!unsupermute":
            if (isMod(message.member)) {
                unsupermuteCommand(message);
            }
            break;
        case "!kick":
            if (isMod(message.member)) {
                kickCommand(message);
            }
            break;
        case "!ban":
            if (isMod(message.member)) {
                banCommand(message);
            }
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
        default:
            dontAtMe(message);
            break;
  }
});

bot.on('guildMemberAdd', member => {
    db.query("SELECT * FROM members WHERE server = ? AND id = ?", [member.guild.id, member.id], function (err, rows) {
        var joinType = (rows.length > 0) ? "rejoined" : "joined";
        log(member.guild, member.user.username + "#" + member.user.discriminator + " has " + joinType + " the server.");
    });
});

bot.on('guildMemberRemove', member => {
    db.query("UPDATE members SET active=0 WHERE server = ? AND id = ?", [member.guild.id, member.id]);
    log(member.guild, member.user.username + "#" + member.user.discriminator + " has left the server.");
});

bot.on('messageDelete', message => {
    if (message.channel.type != 'text') {
        return;
    }

    var words = message.content.replace(/\s\s+|\r?\n|\r/g, ' ').split(" ").length;

    if (channelCountsInStatistics(message.channel.guild.id, message.channel.id))
    {
        // To help discourage spamming for wordcount
        var removedWords = (words > 20) ? Math.round(words * 1.25) : words;
        db.query("UPDATE members SET words=words-?, messages=messages-1 WHERE id=? AND server=?",
         [removedWords, message.author.id, message.channel.guild.id]);
    }
    var attachmentUrls = "";
    if (message.attachments.size > 0) {
        message.attachments.forEach(function (attachment, key, map) {
            attachmentUrls = "\nAttachment: " + attachment.url;
        });
    }

    db.query("UPDATE channel_stats SET total_messages=total_messages-1 WHERE channel = ?", [words, message.channel.id]);
    db.query("UPDATE messages SET edited=now(), message='(deleted)' WHERE discord_id = ?", [message.id]);
    log(message.channel.guild, "Deleted message by " + message.author.username + " in "+message.channel.name+":\n```"
    +  message.cleanContent.replace('`','\\`') + attachmentUrls + "```");
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
        'ON DUPLICATE KEY UPDATE total_messages=total_messages+1, name=?',
        [message.channel.id, message.channel.guild.id, message.channel.name, message.channel.name]
    );

    db.query("INSERT INTO messages (discord_id, date, server, channel, message, author) VALUES (?,now(),?,?,?,?)",
     [message.id, message.channel.guild.id, message.channel.id, message.cleanContent, message.author.id]);
}

function getMemberMentionedFromText(message)
{
    var command = message.content.split(" ");
    var params = command.slice(1, command.length).join(" ");

    var mentionsCount = message.mentions.members.size;
    if (mentionsCount > 0) {
        return message.mentions.members.first().id;
    } else {
        db.query("SELECT id FROM members WHERE server=? AND username=? ORDER BY messages DESC LIMIT 1",
         [message.channel.guild.id, params], function(err, rows) {
            if (rows[0] != null) {
                return rows[0].id;
            }
            return null;
        });
    }
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

function secondsToTime(seconds, short)
{
    var sec = seconds % 60;
    var minutes = Math.floor(seconds / 60) % 60;
    var hours = Math.floor(seconds / 3600) % 24;
    var days = Math.floor(seconds / 86400);

    var result = "";
    if (days > 0) {
        result += days + (short ? "d" : " day");
        if (!short) {
            result += days != 1 ? "s " : " ";
        }
    }
    if (hours > 0) {
        result += hours + (short ? "h" : " hour");
        if (!short) {
            result += hours != 1 ? "s " : " ";
        }
    }
    if (minutes > 0) {
        result += minutes + (short ? "m" : " minute");
        if (!short) {
            result += minutes > 1 ? "s " : " ";
        }
    }
    if(sec > 0) {
        result += sec + (short ? "s" : " second");
        if (!short) {
            result += sec != 1 ? "s " : " ";
        }
    }
    return result;
}



// Basic commands (no db involvement, usable by all users)


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
    var nenified = params.replaceAll('m','n').replaceAll('M','N').replaceAll('\uD83C\uDDF2','\uD83C\uDDF3');
    message.reply(nenified);
}

function activityCommand(message)
{
    search  = (message.mentions.members.size > 0) ? message.mentions.members.first().id : message.author.id;
    var botsString = (message.content.includes('bots')) ? '&includebots=true' : '';
    message.reply("https://tay.rocks/activityreport.php?server="+message.channel.guild.id+"&user="+search+botsString);
}

// Database-oriented commands

function randomMemberCommand(message, days)
{
    var dayLimit = parseInt(days, 10);
    if (!dayLimit) {
        dayLimit = 1;
    }
    var time = Math.floor(new Date()/1000) - (86400 * dayLimit);
    db.query("SELECT username FROM members WHERE server = ? AND lastseen > ? ORDER BY RAND() LIMIT 1",
    [message.channel.guild.id, time], function (err, rows) {
        if (rows != null) {
            message.reply("random member: " + rows[0].username);
        }
    });
}

function channelStatsCommand(message)
{
    db.query("SELECT * FROM channel_stats WHERE channel = ?", [message.channel.id], function (err, rows)
    {
        var total = rows[0].total_messages;
        var startdate = new Date(rows[0].startdate*1000);
        message.reply("there have been " + total + " messages sent since " + startdate.toDateString() + " in this channel.");
    });
}

function poopCommand(message)
{
    if (Math.random() < 0.05) {
        db.query("UPDATE members SET poops=0 WHERE id=? AND server=?", [message.author.id,  message.channel.guild.id]);
        message.reply("you clogged the toilet!! :toilet:\nYour :poop: streak has been reset to 0.");
    } else {
        db.query("SELECT poops FROM members WHERE server = ? AND id = ?", [message.channel.guild.id, message.author.id], function(err, rows)
        {
            if (rows[0] != null) {
                var poopStreak = rows[0].poops + 1;
                db.query("UPDATE members SET poops=poops+1 WHERE id=? AND server=?", [message.author.id,  message.channel.guild.id]);
                message.reply("you have pooped. :poop:\nYour :poop: streak is now " + poopStreak + ".");
            }
        });
    }
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

function addShitpostCommand(message, shitpost)
{
    db.query("INSERT INTO shitposts (shitpost, addedby, addedon) VALUES (?,?,now())",
    [shitpost, message.author.id], function (err, result) {
        message.reply("added #"+result.insertId+".");
    });
}

function nameCommand(message, command)
{
    var genders = ['m', 'f'];
    var gender = command[1] == null || (command[1].toLowerCase() != 'm' && command[1].toLowerCase() != 'f')
     ? genders[Math.floor(Math.random() * genders.length)] : command[1];
    var year = 2000;
    if (parseInt(command[2]) >= 1970 && parseInt(command[2]) <= 2014)
        year = command[2];
    var limit = 300;
    if (parseInt(command[3]))
        limit = command[3];
    db.query("SELECT * FROM names WHERE gender = ? AND rank <= ? AND year = ? ORDER BY RAND() LIMIT 1",
     [gender, limit, year], function (err, rows) {
        if (rows[0] != null)
        {
            message.reply("your new name is " + rows[0].name + ".");
        }
    });
}

function rankThingCommand(message, thing, number)
{
    var rankString = "Users with most " + thing + ":\n";
    if (isNaN(number) || number < 1 || number > 50) {
        number = 10;
    }
    db.query("SELECT username, " + thing + " AS thing FROM members WHERE server = ? AND poops > 0 AND active=1 ORDER BY " + thing + " DESC LIMIT ?",
     [message.channel.guild.id, number], function (err, rows)
    {
        var count = 1;
        rows.forEach(function (member) {
            rankString += count + ": " + member.username + " - " + member.thing + " " + thing + "\n";
            count++;
        });
        message.reply(rankString);
    });
}

function seenCommand(message, params)
{
    if (message.mentions.members.size > 0) {
        member = message.mentions.members.first().user.username;
    } else {
        member = params;
    }

    if (member == bot.user.id) {
        message.reply("I'm right here!");
    } else if (member == message.author.id) {
        message.reply("look in a mirror!");
    } else {
        db.query("SELECT username, discriminator, lastseen, active FROM members WHERE server = ? AND username = ? ORDER BY messages DESC LIMIT 1",
         [message.channel.guild.id, member], function(err, rows) {
            if (rows[0] == null) {
                message.reply('user not found. Pleaes double check the username.');
            } else {
                var seconds = Math.floor(new Date() / 1000) - rows[0].lastseen;
                var date = new Date(rows[0].lastseen * 1000);
                var leftServerText = (rows[0].active) ? '' : '\nThis user has left the server.';
                message.reply(rows[0].username + '#' + rows[0].discriminator + ' was last seen '
                + secondsToTime(seconds, false) + 'ago. ('+date.toDateString()+')' + leftServerText);
            }
        });
    }
}

function lastCommand(message, params, old)
{
    var member;
    if (message.mentions.members.size > 0) {
        member = message.mentions.members.first().user.username;
    } else {
        member = params;
    }
    var table = (old) ? "old_messages" : "messages";
    db.query("SELECT mem.username, mem.discriminator, mem.lastseen, TIMESTAMPDIFF(SECOND,msg.date,now()) AS messageage, msg.message, msg.id, c.name FROM "+table+" msg " +
        "JOIN members mem ON msg.server=mem.server AND msg.author=mem.id " +
        "JOIN channel_stats c ON msg.channel=c.channel " +
        "WHERE mem.server = ? AND mem.username = ? AND (c.web=1 OR c.server != ?) " +
        "ORDER BY msg.id DESC LIMIT 1", [message.channel.guild.id, member, config.mainServer], function (err, rows) {
        var response = "";
        if (rows.length == 0) {
            response = "no messages found. Please double check the username.";
        } else {
            response = "Last message by " + rows[0].username + "#" + rows[0].discriminator + " (" + secondsToTime(rows[0].messageage, true) + " ago in " + rows[0].name + " - #" + rows[0].id + ")\n" +
                rows[0].message;
        }
        message.reply(response);
    });
}

function wordsCommand(message, params)
{
    var member;
    if (message.mentions.members.size > 0) {
        member = message.mentions.members.first().user.username;
    } else if (params != '') {
        member = params;
    } else {
        member = message.author.username;
    }

    db.query("SELECT words, messages, username FROM members WHERE server = ? AND username = ?",
    [message.channel.guild.id, member], function (err, rows) {
        if (err != null) {
            console.log(err);
            return;
        }
        if (rows[0] != null) {
            var average = (rows[0].messages > 0) ? Math.round(rows[0].words / rows[0].messages * 100) / 100 : 0;
            message.reply(rows[0].username + " has used " + rows[0].words + " words in " +  rows[0].messages
             + " messages, an average of " + average + " words per message.");
        } else {
            message.reply("user not found. Please double check the username.");
        }
    });

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

function saveCommand(message)
{
    var command = message.content.split(" ");
    if (command[1] == null)
        return;
    if (command[1].startsWith("http")) {
        message.reply("you probably dun goof'd your command. The keyword comes first!");
        return;
    }
    if (command[2] == null) {
        message.reply("you need to specify a value (the thing you want saved) for that keyword.");
        return;
    }

    var key = command[1];
    var value = command.slice(2, command.length).join(" ");
    // check for existing
    db.query("SELECT * FROM data_store WHERE server = ? AND keyword = ?", [message.channel.guild.id, key], function (err, rows) {
        if ((isMod(message.member) || message.channel.guild.id != config.mainServer) && (rows[0] == null || rows[0]['owner'] == message.author.id)) {
            db.query("REPLACE INTO data_store (server, keyword, value, owner, approved) VALUES (?,?,?,?,1)", [message.channel.guild.id, key, value, message.author.id]);
            message.reply("updated and ready to use.");
            log(message.channel.guild, message.author.username + " created item " + key + " - auto approved\nValue: "+value);
        } else if (rows[0] == null) {
            db.query("INSERT INTO data_store (server, keyword, value, owner) VALUES (?,?,?,?)", [message.channel.guild.id, key, value, message.author.id]);
            message.reply("created. This will need to be approved before it can be used.");
            log(message.channel.guild, message.author.username + " created item " + key + " - pending approval\nValue: "+value);
        } else if (rows[0]['owner'] == message.author.id) {
            db.query("UPDATE data_store SET value = ?, approved=0 WHERE keyword = ? AND server = ?", [value, key, message.channel.guild.id]);
            message.reply("updated. This will need to be approved before it can be used.");
            log(message.channel.guild, message.author.username + " updated item " + key + " - pending approval\nValue: "+value);
        } else {
            message.reply("this keyword already exists.");
        }
    });
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

function getUnapprovedCommand(message)
{
    db.query("SELECT * FROM data_store WHERE approved = 0 AND server = ?", [message.channel.guild.id], function (err, rows) {
        if (rows.length == 0) {
            message.reply("no unapproved items.");
            return;
        }

        var list = "";
        for (var i = 0; i < rows.length; i++) {
            list = list + rows[i].keyword + " ";
        }
        message.reply("unapproved: ``" + list + "``");
    });
}

// Guild property commands (roles, permissions, etc)

function topicCommand(message, topic)
{
    message.channel.setTopic(topic, "Set by " + message.author.username);
    log(message.channel.guild, "Topic in " + message.channel.name + " has been changed by "
    + message.author.username + " to " + topic );
    message.reply("topic updated.");
}

function regionCommand(message, region)
{
    var america = message.channel.guild.roles.find('name','america');
    var southamerica = message.channel.guild.roles.find('name', 'southamerica');
    var europe = message.channel.guild.roles.find('name','europe');
    var asia = message.channel.guild.roles.find('name','asia');
    var africa = message.channel.guild.roles.find('name','africa');
    var oceania = message.channel.guild.roles.find('name','oceania');
    var allRegions = [america, southamerica, europe, asia, africa, oceania];

    switch (region) {
        case "clear":
            message.member.removeRoles(allRegions);
            message.reply("your region has been cleared.");
        break;
        case "america":
        case "northamerica":
            message.member.removeRoles(allRegions).then(updated => updated.addRole(america));
            message.reply("your region has been set to North America.");
        break;
        case "southamerica":
            message.member.removeRoles(allRegions).then(updated => updated.addRole(southamerica));
            message.reply("your region has been set to South America.");
        break;
        case "europe":
            message.member.removeRoles(allRegions).then(updated => updated.addRole(europe));
            message.reply("your region has been set to Europe.");
        break;
        case "asia":
            message.member.removeRoles(allRegions).then(updated => updated.addRole(asia));
            message.reply("your region has been set to Asia.");
        break;
        case "africa":
            message.member.removeRoles(allRegions).then(updated => updated.addRole(africa));
            message.reply("your region has been set to Africa.");
        break;
        case "oceania":
            message.member.removeRoles(allRegions).then(updated => updated.addRole(oceania));
            message.reply("your region has been set to Oceania.");
        break;
        default:
            message.reply("region not recognized. Acceptable values: northamerica, southamerica, europe, asia, africa, oceania, clear.");
        break;
    }
}

function muteCommand(message)
{
    message.mentions.members.forEach(function (member, key, map) {
        if (isMod(member)) {
            message.reply(":smirk:");
        } else {
            message.channel.overwritePermissions(member, { 'SEND_MESSAGES' : false });
            message.reply(member.user.username + " has been muted.");
        }
    });
}

function unmuteCommand(message)
{
    message.mentions.members.forEach(function (member, key, map) {
        if (isMod(member)) {
            message.reply(":smirk:");
        } else {
            message.channel.overwritePermissions(member, { 'SEND_MESSAGES' : null });
            message.reply(member.user.username + " has been unmuted.");
        }
    });
}

function supermuteCommand(message)
{
    var supermute = message.channel.guild.roles.find('name','supermute');
    message.mentions.members.forEach(function (member, key, map) {
        if (isMod(member)) {
            message.reply(":smirk:");
        } else {
            member.addRole(supermute);
            message.reply(member.user.username + " has been supermuted.");
        }
    });
}

function unsupermuteCommand(message)
{
    var supermute = message.channel.guild.roles.find('name','supermute');
    message.mentions.members.forEach(function (member, key, map) {
        if (isMod(member)) {
            message.reply(":smirk:");
        } else {
            member.removeRole(supermute);
            message.reply(member.user.username + " has been un-supermuted.");
        }
    });
}

function kickCommand(message)
{
    message.mentions.members.forEach(function (member, key, map) {
        if (isMod(member)) {
            message.reply(":smirk:");
        } else {
            var reason = message.cleanContent.replace('!kick ', '');
            member.kick(reason);
            message.reply(member.user.username + " has been kicked.");
        }
    });
}

function banCommand(message)
{
    message.mentions.members.forEach(function (member, key, map) {
        if (isMod(member)) {
            message.reply(":smirk:");
        } else {
            var reason = message.cleanContent.replace('!ban ', '');
            member.ban(reason);
            message.reply(member.user.username + " has been banned.");
        }
    });
}

// Bot admin commands

function fsayCommand(message, params)
{
    message.channel.send(params);
    message.delete();
}

// lol

function dontAtMe(message)
{
    var lowerMessage = message.content.toLowerCase();
    if (lowerMessage.includes('dont @ me') || lowerMessage.includes("don't @ me")) {
        message.reply(":smirk:");
    }
}
