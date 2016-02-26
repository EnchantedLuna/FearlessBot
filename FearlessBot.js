var Discord = require("discord.js");
var config = require("./auth.json");
var mysql = require("mysql");
var units = require("node-units");
var db = mysql.createConnection({
    host: config.mysqlHost,
    user: config.mysqlUser,
    password: config.mysqlPass,
    database: config.mysqlDB,
    charset: "utf8mb4"
});

var mybot = new Discord.Client();
var search;

var eightBallAnswers = ["it is certain", "it is decidedly so", "without a doubt", "yes, definitely", "you may rely on it",
    "as I see it, yes", "most likely", "outlook good", "yes", "signs point to yes", "reply hazy try again", "ask again later",
    "better not tell you now", "cannot predict now", "concentrate and try again", "don't count on it", "my reply is no", "my sources say no",
    "very doubtful", "lol no", "no way", "you have a better chance of getting a Blade selfie", "the probability is the same as Taylor ever ever getting back together (i.e. never)",
    "http://i.imgur.com/faYfXxE.gif"];

var taylorSwiftSongs = ["Tim McGraw", "Picture to Burn", "Teardrops on My Guitar", "A Place in This World", "Cold As You", "The Outside",
    "Tied Together With a Smile", "Stay Beautiful", "Should've Said No", "Mary's Song", "Our Song", "I'm Only Me When I'm With You",
    "Invisible", "A Perfectly Good Heart", "Jump Then Fall", "Untouchable", "Forever and Always (piano)", "Come In With The Rain", "SuperStar",
    "The Other Side of the Door", "Fearless", "Fifteen", "Love Story", "White Horse", "You Belong With Me", "Breathe", "Tell Me Why", "You're Not Sorry",
    "The Way I Loved You", "Forever and Always", "The Best Day", "Change", "Mine", "Sparks Fly", "Back to December", "Speak Now", "Dear John", "Mean", "The Story of Us",
    "Never Grow Up", "Enchanted", "Better Than Revenge", "Innocent", "Haunted", "Last Kiss", "Long Live", "Ours", "If This Was A Movie", "Superman",
    "State of Grace", "Red", "Treacherous", "I Knew You Were Trouble", "All Too Well", "22", "I Almost Do", "We Are Never Ever Getting Back Together",
    "Stay Stay Stay", "The Last Time", "Holy Ground", "Sad Beautiful Tragic", "The Lucky One", "Everything Has Changed", "Starlight", "Begin Again",
    "The Moment I Knew", "Come Back, Be Here", "Girl At Home", "Welcome To New York", "Blank Space", "Style", "Out of the Woods",
    "All You Had To Do Was Stay", "Shake it Off", "I Wish You Would", "Bad Blood", "Wildest Dreams", "How You Get the Girl", "This Love",
    "I Know Places", "Clean", "Wonderland", "You Are In Love", "New Romantics", "Safe and Sound", "Eyes Open", "Today Was a Fairytale", "Sweeter Than Fiction","Ronan"];

mybot.on("message", function (message)
{
    if (message.channel.isPrivate)
    {
        handlePM(message);
        return;
    }
    if (message.everyoneMentioned)
    {
        return;
    }
    var user = message.author;
    var channel = message.channel.name;
    var command = message.content.split(" ");
    var params = command.slice(1, command.length).join(" ");

    // Increment total count
    db.query(
        'INSERT INTO channel_stats (channel, server, total_messages, name, web, startdate) VALUES (?,?,1,?,0,UNIX_TIMESTAMP()) ' +
        'ON DUPLICATE KEY UPDATE total_messages=total_messages+1',
        [message.channel.id, message.channel.server.id, message.channel.name]
    );

    // Check user info
    var words = message.content.replace(/\s\s+|\r?\n|\r/g, ' ').split(" ").length;
    if (message.channel.server.id != config.mainServer || message.channel.id == "115332333745340416" || message.channel.id == "119490967253286912" || message.channel.id == "131994567602995200")
    {
        db.query("INSERT INTO members (server, id, username, lastseen, words, messages) VALUES (?,?,?,UNIX_TIMESTAMP(),?,1)" +
            "ON DUPLICATE KEY UPDATE username=?, lastseen=UNIX_TIMESTAMP(), words=words+?, messages=messages+1, active=1",
            [message.channel.server.id, user.id, user.username, words, user.username, words]);
    }
    else
    {
        db.query("INSERT INTO members (server, id, username, lastseen) VALUES (?,?,?,UNIX_TIMESTAMP())" +
            "ON DUPLICATE KEY UPDATE username=?, lastseen=UNIX_TIMESTAMP(), active=1",
            [message.channel.server.id, user.id, user.username, user.username]);
    }

    if (message.mentions.length > 0) {
        message.mentions.forEach(function (mention) {
            var msg = unmention(message.content, message.mentions);
            // Ignore bots if this is the first user mentioned (likely a response to a command initiated by that user)
            if ((inRole(message.channel.server, message.author, "bots") || message.author.id == mybot.user.id) && msg.startsWith("@"+mention.username))
                return;

            // I would use hasPermission for these, but there seems to be a bug in it currently (not taking into account @everyone overrides)
            if (message.channel.id == "130759361902542848" && !inRole(message.channel.server, mention, "beta")
                && !isMod(message.channel.server, mention) && !inRole(message.channel.server, mention, "bots"))
                return;

            if (message.channel.id == "117809670156058633" && !inRole(message.channel.server, mention, "bots")
                && !isMod(message.channel.server, mention) && mention.id != 118114929474666502)
                return;

            db.query("INSERT INTO mention_log (server, user, timestamp, channel, author, message) VALUES (?,?,?,?,?,?)",
                    [message.channel.server.id, mention.id, message.timestamp / 1000, message.channel.name, message.author.id, msg]);

        });
    }

    // Only allow whitelisted commands in taylordiscussion
    var allowed = ["!mute","!unmute","!kick","!ban","!unban","!topic","!supermute","!unsupermute"];
    if (message.channel.id == "131994567602995200" && allowed.indexOf(command[0]) == -1) {
        return;
    }

    var nontscommands = ["!8ball","!name","!g","!get","!channelstats","!song","!id","!seen","!words","!save","!mentions","!rankwords","!getlist","!convert","!choose"];
    // Limited functionality outside the ts server
    if (message.channel.server.id != config.mainServer && nontscommands.indexOf(command[0]) == -1) {
        return;
    }


    // Check for commands
    switch (command[0].toLowerCase())
    {
        case "!fhelp":
            mybot.reply(message, "a list of commands is available at https://www.reddit.com/r/TaylorSwift/wiki/discord");
            break;
        case "!rules":
            mybot.reply(message, "for the current rules, see the wiki: https://www.reddit.com/r/TaylorSwift/wiki/discord");
            break;
        case "!id":
            if (message.channel.server.id != config.mainServer) {
                mybot.reply(message, "your user id is " + user.id + ".");
            }
            break;
        case "!region":
        case "!setregion":
            updateRegion(message);
            break;
        case "!8ball":
            var answer = eightBallAnswers[Math.floor(Math.random() * eightBallAnswers.length)];
            mybot.reply(message, answer + ".");
            break;
        case "!choose":
            var choices = params.split(",");
            if (choices.length > 1)
            {
                var selectedChoice = choices[Math.floor(Math.random() * choices.length)];
                mybot.reply(message, "I pick: " + selectedChoice.trim());
            }
            break;
        case "!song":
            var song = taylorSwiftSongs[Math.floor(Math.random() * taylorSwiftSongs.length)];
            mybot.reply(message, "you should listen to " + song + ".");
            break;
        case "!channelstats":
            db.query("SELECT * FROM channel_stats WHERE channel = ?", [message.channel.id], function (err, rows)
            {
                var total = rows[0].total_messages;
                var startdate = new Date(rows[0].startdate*1000);
                mybot.reply(message, "there have been " + total + " messages sent since "+ startdate.toDateString() +" in this channel.");
            });
            break;
        case "!name":
            var genders = ['m', 'f'];
            var gender = command[1] == null || (command[1].toLowerCase() != 'm' && command[1].toLowerCase() != 'f') ? genders[Math.floor(Math.random() * genders.length)] : command[1];
            var year = 2000;
            if (parseInt(command[2]) >= 1970 && parseInt(command[2]) <= 2014)
                year = command[2];
            var limit = 300;
            if (parseInt(command[3]))
                limit = command[3];
            db.query("SELECT * FROM names WHERE gender = ? AND rank <= ? AND year = ? ORDER BY RAND() LIMIT 1", [gender, limit, year], function (err, rows)
            {
                if (rows[0] != null)
                {
                    mybot.reply(message, "your new name is " + rows[0].name);
                }
            });
            break;
        case "!seen":
            if (message.mentions.length > 0)
            {
                search = message.mentions[0].username;
            }
            else
            {
                search = params;
            }
            if (search.toLowerCase() == "fearlessbot")
            {
                mybot.reply(message, "I'm right here!");
                return;
            }
            else if (search.toLowerCase() == message.author.username.toLowerCase())
            {
                mybot.reply(message, "You don't know if you're here or not? :smirk:");
                return;
            }
            db.query("SELECT lastseen, active FROM members WHERE server = ? AND username = ?", [message.channel.server.id, search], function (err, rows)
            {
                if (rows[0] != null)
                {
                    var response = search + " was last seen " + secondsToTime(Math.floor(new Date() / 1000) - rows[0].lastseen) + "ago.";
                    if (rows[0].active == 0)
                    {
                        response += "\nThis person does not appear to be on the member list. This may mean that he or she may have left the server or have been pruned or kicked.";
                    }
                    mybot.reply(message, response);
                }
            });
            break;
        case "!words":
            if (message.mentions.length > 0)
            {
                search = message.mentions[0].username;
            }
            else if (command[1] != null)
            {
                search = params;
            }
            else
            {
                search = user.username;
            }

            db.query("SELECT words, messages FROM members WHERE server = ? AND username = ?", [message.channel.server.id, search], function (err, rows)
            {
                if (rows[0] != null)
                {
                    var average = (rows[0].messages > 0) ? Math.round(rows[0].words / rows[0].messages * 100) / 100 : 0;
                    // Don't show message count in main server, TaylorBot has been doing that longer
                    var msgcount = (message.channel.server.id == config.mainServer) ? "" : " in " + rows[0].messages + " messages";
                    mybot.reply(message, search + " has used " + rows[0].words + " words" +  msgcount + ". (average " + average + " per message)");
                }
            });
            break;
        case "!rankwords":
            var numberToGet = 5;
            var rankString = "Word Count Ranking:\n";
            if (parseInt(command[1]) > 0 && parseInt(command[1]) < 60)
            {
                numberToGet = parseInt(command[1]);
            }
            db.query("SELECT username, words, messages FROM members WHERE server = ? AND words > 0 AND active=1 ORDER BY words DESC LIMIT ?", [message.channel.server.id, numberToGet], function (err, rows)
            {
                var count = 1;
                rows.forEach(function (member) {
                    rankString += count + ": " + member.username + " - " + member.words + " words\n";
                    count++;
                });
                mybot.sendMessage(message.channel, rankString);
            });
            break;
        case "!save":
            saveThing(message);
            break;
        case "!g":
        case "!get":
            if (command[1] == null)
                return;
            var dataserver = (command[2] == "ts") ? config.mainServer : message.channel.server.id;
            db.query("SELECT * FROM data_store WHERE server = ? AND keyword = ?", [dataserver, command[1]], function (err, rows)
            {
                if (rows[0] == null)
                {
                    mybot.reply(message, "nothing is stored for keyword " + command[1] + ".");
                }
                else if (!rows[0].approved)
                {
                    mybot.reply(message, "this item has not been approved yet.");
                }
                else
                {

                    mybot.reply(message, rows[0]['value']);
                    db.query("UPDATE data_store SET uses=uses+1 WHERE keyword = ?", [command[1]]);
                }
            });

            break;
        case "!getlist":
                mybot.reply(message, "https://youregoingtolove.me/fearlessdata.php?server=" + message.channel.server.id);
            break;
        case "!mentions":
            sendMentionLog(message);
            break;
        case "!randmember":
            var day = Math.floor(new Date()/1000) - 86400;
            db.query("SELECT username FROM members WHERE lastseen > ? ORDER BY RAND() LIMIT 1", [day], function (err, rows) {
                if (rows != null) {
                    mybot.reply(message, "random member: " + rows[0].username);
                }
            });
            break;
        case "!convert":
            try{
                var value = units.convert(params);
                mybot.reply(message, (Math.round(value * 100) / 100) + " " + command[command.length - 1]);
            } catch(e){
                mybot.reply(message, e);
            }
            break;
        // Mod commands below
        case "!approve":
            if (isMod(message.channel.server, user))
            {
                db.query("UPDATE data_store SET  approved=1 WHERE keyword = ? AND server = ?", [command[1], message.channel.server.id], function (err, result)
                {
                    if (result.affectedRows > 0)
                    {
                        mybot.reply(message, "approved.");
                    }
                    else
                    {
                        mybot.reply(message, "nothing to approve.");
                    }
                });
            }
            else
            {
                mybot.reply(message, "nice try.");
            }
            break;
        case "!delete":
            if (isMod(message.channel.server, user))
            {
                db.query("DELETE FROM data_store WHERE server = ? AND keyword = ?", [message.channel.server.id, command[1]], function (err, result)
                {
                    if (result.affectedRows > 0)
                    {
                        mybot.reply(message, "deleted.");
                    }
                    else
                    {
                        mybot.reply(message, "keyword not found.");
                    }
                });
            }
            else
            {
                mybot.reply(message, "nice try.");
            }
            break;
        case "!review":
            if (!isMod(message.channel.server, user))
                return;
            db.query("SELECT * FROM data_store WHERE server = ? AND keyword = ?", [message.channel.server.id, command[1]], function (err, rows)
            {
                if (rows[0] == null)
                {
                    mybot.reply(message, "nothing is stored for keyword " + command[1] + ".");
                }
                else
                {
                    mybot.reply(message, rows[0]['value']);
                }
            });
            break;
        case "!getunapproved":
            if (isMod(message.channel.server, user))
            {
                db.query("SELECT * FROM data_store WHERE approved = 0", function (err, rows)
                {
                    if (rows.length == 0)
                    {
                        mybot.reply(message, "no unapproved items.");
                        return;
                    }


                    var list = "";
                    for (var i = 0; i < rows.length; i++)
                    {
                        list = list + rows[i].keyword + " ";
                    }
                    mybot.reply(message, "unapproved: ``" + list + "``");
                });
            }
            break;
        case "!kick":
            if (isMod(message.channel.server, user))
            {
                message.mentions.forEach(function (person)
                    {
                        if (!isMod(message.channel.server, person))
                        {
                            mybot.kickMember(person, message.channel.server);
                            mybot.reply(message, person.username + " has been kicked.");
                        }
                    }
                );
            }
            else
            {
                mybot.reply(message, "nice try.");
            }
            break;
        case "!ban":
            if (isMod(message.channel.server, user))
            {
                message.mentions.forEach(function (person)
                    {
                        if (!isMod(message.channel.server, person))
                        {
                            mybot.banMember(person, message.channel.server, 1);
                            db.query("UPDATE members SET active = 0 WHERE id = ? AND server = ?", [person.id, message.channel.server.id]);
                            mybot.reply(message, person.username + " has been banned.");
                        }
                    }
                );
            }
            else
            {
                mybot.reply(message, "nice try.");
            }
            break;
        case "!unban":
            if (isMod(message.channel.server, user))
            {
                message.mentions.forEach(function (person)
                    {
                        if (!isMod(message.channel.server, person))
                        {
                            mybot.unbanMember(person, message.channel.server);
                            mybot.reply(message, person.username + " has been unbanned.");
                        }
                    }
                );
            }
            else
            {
                mybot.reply(message, "nice try.");
            }
            break;
        case "!topic":
            if (isMod(message.channel.server, user) && params !== null)
            {
                mybot.setChannelTopic(message.channel, params);
                mybot.reply(message, "topic updated.");
            }
            else
            {
                mybot.reply(message, "nice try.");
            }
            break;
        case "!mute":
            if (isMod(message.channel.server, user))
            {
                message.mentions.forEach(function (person)
                    {
                        if (!isMod(message.channel.server, person))
                        {
                            mybot.overwritePermissions(message.channel, person, {sendMessages: false});
                            mybot.reply(message, person.username + " has been muted.");
                        }
                    }
                );
            }
            else
            {
                mybot.reply(message, "nice try.");
            }
            break;
        case "!unmute":
            if (isMod(message.channel.server, user))
            {
                message.mentions.forEach(function (person)
                    {
                        if (!isMod(message.channel.server, person))
                        {
                            mybot.overwritePermissions(message.channel, person, {});
                            mybot.reply(message, person.username + " has been unmuted.");
                        }
                    }
                );

            }
            else
            {
                mybot.reply(message, "nice try.");
            }
            break;
        case "!supermute":
            if (isMod(message.channel.server, user))
            {
                message.mentions.forEach(function (person)
                    {
                        if (!isMod(message.channel.server, person))
                        {
                            mybot.addMemberToRole(person, message.channel.server.roles.get("name", "supermute"));
                            mybot.reply(message, person.username + " has been super muted.");
                        }
                    }
                );
            }
            else
            {
                mybot.reply(message, "nice try.");
            }
            break;
        case "!unsupermute":
            if (isMod(message.channel.server, user))
            {
                message.mentions.forEach(function (person)
                    {
                        if (!isMod(message.channel.server, person) && inRole(message.channel.server, person, "supermute"))
                        {
                            mybot.removeMemberFromRole(person, message.channel.server.roles.get("name", "supermute"));
                            mybot.reply(message, person.username + " has been un super muted.");
                        }
                    }
                );
            }
            else
            {
                mybot.reply(message, "nice try.");
            }
            break;
        case "!fsay":
            if (inRole(message.channel.server, user, "admins"))
            {
                mybot.deleteMessage(message);
                mybot.sendMessage(message.channel, params);
            }
            break;
        case "!setstatus":
            if (inRole(message.channel.server, user, "admins"))
            {
                mybot.setStatus("online",params);
            }
            break;
        case "!checkactive":
            if (inRole(message.channel.server, user, "admins"))
            {
                db.query("SELECT id FROM members WHERE server = ? AND active=1", [message.channel.server.id], function (err, rows)
                {
                    for (var i=0; i < rows.length; i++)
                    {
                        var member = message.channel.server.members.get("id",rows[i].id);
                        if (member == null)
                        {
                            db.query("UPDATE members SET active=0 WHERE server = ? AND id = ?", [message.channel.server.id, rows[i].id]);
                        }
                    }
                });
            }
            break;
    }
});

mybot.on("serverNewMember", function (server, user)
{
    var username = user.username;
    mybot.sendMessage(server.defaultChannel, username + " has joined the server. Welcome!");
});

mybot.on("messageDeleted", function (message, channel)
{
    if (message == null)
    {
        return;
    }
    if (message.channel.id == "115332333745340416" || message.channel.id == "119490967253286912" || message.channel.id == "131994567602995200")
    {
        var words = message.content.replace(/\s\s+|\r?\n|\r/g, ' ').split(" ").length;
        var removedWords = (words > 20) ? Math.round(words * 1.5) : words; // To help discourage spamming for wordcount
        db.query("UPDATE members SET words=words-? WHERE id=?", [removedWords, message.author.id]);
        db.query("UPDATE channel_stats SET total_messages=total_messages-1 WHERE channel = ?", [words, channel.id]);
    }
});

mybot.on("presence", function (oldUser, newUser)
{
    if (oldUser.username != newUser.username)
    {
        db.query("SELECT server, username FROM members WHERE id = ? AND active=1", [newUser.id], function (err, rows)
        {
            for (var i=0; i < rows.length; i++)
            {
                mybot.sendMessage(rows[i].server, rows[i].username + " has changed username to " + newUser.username.replace("@", "") + ".");
                db.query("UPDATE members SET username=? WHERE id = ?", [newUser.username, newUser.id]);
            }
        });
    }
});

/*
setInterval(function() {
    console.log("Starting hourly cleanup.");
    db.query("SELECT id, username, server FROM members WHERE active=1", function (err, rows)
    {
        for (var i=0; i < rows.length; i++)
        {
            var member = mybot.servers.get("id",rows[i].server).members.get("id",rows[i].id);
            if (member == null)
            {
                console.log(rows[i].username + " has become inactive - id: " + rows[i].id);
                db.query("UPDATE members SET active=0 WHERE server = ? AND id = ?", [rows[i].server, rows[i].id]);
            }
        }
    });
}, 3600000);
*/

// Bot functionality for PMs
function handlePM(message)
{
    var command = message.content.split(" ");
    var params = command.slice(1, command.length).join(" ");

    switch (command[0])
    {
        case "!mods":
            var modChannel = mybot.servers.get("id", config.mainServer).channels.get("name", config.modChannel);
            mybot.sendMessage(modChannel, "PM from " + message.author.username + ": " + params);
            mybot.sendMessage(message.channel, "your message has been sent to the mods.");
            break;
        case "!mentions":
            sendMentionLog(message);
            break;
    }
}

function saveThing(message)
{
    var command = message.content.split(" ");
    if (command[1] == null)
        return;
    if (command[2] == null)
    {
        mybot.reply(message, "you need to specify a value (the thing you want saved) for that keyword.");
        return;
    }
    var key = command[1];
    var value = command.slice(2, command.length).join(" ");
    // check for existing
    db.query("SELECT * FROM data_store WHERE server = ? AND keyword = ?", [message.channel.server.id, command[1]], function (err, rows)
    {
        if (isMod(message.channel.server, message.author) ||
            (message.channel.server.id != config.mainServer && (rows[0] == null || rows[0]['owner'] == message.author.id)))
        {
            db.query("REPLACE INTO data_store (server, keyword, value, owner, approved) VALUES (?,?,?,?,1)", [message.channel.server.id, key, value, message.author.id]);
            mybot.reply(message, "updated and ready to use.");
        }
        else if (rows[0] == null)
        {
            db.query("INSERT INTO data_store (server, keyword, value, owner) VALUES (?,?,?,?)", [message.channel.server.id, key, value, message.author.id]);
            mybot.reply(message, "created. This will need to be approved before it can be used.");
        }
        else if (rows[0]['owner'] == message.author.id)
        {
            db.query("UPDATE data_store SET value = ?, approved=0 WHERE keyword = ? AND server = ?", [value, key, message.channel.server.id]);
            mybot.reply(message, "updated. This will need to be approved before it can be used.");
        }
        else
        {
            mybot.reply(message, "this keyword already exists.");
        }
    });
}

function sendMentionLog(message)
{
    var user = message.author;
    var allMessages = [];
    db.query("SELECT username, timestamp, channel, author, message FROM mention_log " +
        "JOIN members ON mention_log.author=members.id AND mention_log.server=members.server " +
        "WHERE user = ? ORDER BY mention_log.id ASC", [user.id], function (err, rows) {
        if (rows.length == 0)
        {
            mybot.sendMessage(user, "No mentions. :(");
            return;
        }
        var msg = "Mention log: \n";
        rows.forEach(function (row) {
            var newmsg = "**" + row.username + " - " + row.channel + " - " + secondsToTime(Math.floor(new Date() / 1000) - row.timestamp) + "**\n";
            newmsg += row.message + "\n\n";

            if (msg.length + newmsg.length > 1900) {
                allMessages.push(msg);
                msg = "Continued:\n";
            }
            msg += newmsg;
        });
        allMessages.push(msg);
        for (var i = 0; i < allMessages.length; i++)
        {
            setTimeout(function(time) {
                mybot.sendMessage(user, allMessages[time]);
            }, i*200, i);
        }
        db.query("DELETE FROM mention_log WHERE user = ?", [user.id]);
        if (!message.channel.isPrivate)
        {
            mybot.reply(message, "PM sent.");
        }
    });
}

function clearRegions(server, user)
{
    var roles = server.rolesOfUser(user);
    var america = server.roles.get("name", "america");
    var europe = server.roles.get("name", "europe");
    var asia = server.roles.get("name", "asia");
    var oceania = server.roles.get("name", "oceania");
    roles.forEach(function (role)
    {
        switch (role.name)
        {
            case "oceania":
                mybot.removeMemberFromRole(user, oceania);
                break;
            case "america":
                mybot.removeMemberFromRole(user, america);
                break;
            case "europe":
                mybot.removeMemberFromRole(user, europe);
                break;
            case "asia":
                mybot.removeMemberFromRole(user, asia);
                break;
        }
    });
}

function updateRegion(message)
{
    var command = message.content.split(" ");
    if (command[1] == null)
    {
        mybot.reply(message, "you need to specify a region. (from: america, europe, asia, oceania)");
        return;
    }
    command[1] = command[1].toLowerCase();
    switch (command[1])
    {
        case "america":
            mybot.addMemberToRole(message.author, message.channel.server.roles.get("name", "america"));
            mybot.reply(message, "your region has been set to America.");
            break;
        case "europe":
            mybot.addMemberToRole(message.author, message.channel.server.roles.get("name", "europe"));
            mybot.reply(message, "your region has been set to Europe.");
            break;
        case "asia":
            mybot.addMemberToRole(message.author, message.channel.server.roles.get("name", "asia"));
            mybot.reply(message, "your region has been to Asia.");
            break;
        case "oceania":
        case "australia":
            mybot.addMemberToRole(message.author, message.channel.server.roles.get("name", "oceania"));
            mybot.reply(message, "your region has been set to Oceania.");
            break;
        case "clear":
            clearRegions(message.channel.server, message.author);
            break;
        default:
            mybot.reply(message, "unrecognized region. Accepted values: america, europe, asia, oceania, clear");
            break;
    }
}

function inRole(server, user, needle)
{
    var roles = server.rolesOfUser(user);
    for(var i = 0; i < roles.length; ++i)
    {
      if (roles[i].name === needle)
      {
        return true;
      } 
    }
    return false;
}


function isMod(server, user)
{
    return inRole(server, user, "admins") || inRole(server, user, "chat mods");
}

function secondsToTime(seconds)
{
    var sec = seconds % 60;
    var minutes = Math.floor(seconds / 60) % 60;
    var hours = Math.floor(seconds / 3600) % 24;
    var days = Math.floor(seconds / 86400);

    var result = "";
    if (days > 0)
    {
        result += days + " day";
        result += days != 1 ? "s " : " ";
    }
    if (hours > 0)
    {
        result += hours + " hour";
        result += hours != 1 ? "s " : " ";
    }
    if (minutes > 0)
    {
        result += minutes + " minute";
        result += minutes > 1 ? "s " : " ";
    }
    if(sec > 0)
    {
        result += sec + " second";
        result += sec != 1 ? "s " : " ";
    }
    return result;
}

function unmention(message, mentions)
{
    for (var i = 0; i < mentions.length; i++)
    {
        message = message.replace("<@" + mentions[i].id + ">", "@"+mentions[i].username);
    }
    return message;
}

mybot.login(config.email, config.password);
