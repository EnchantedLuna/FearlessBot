var Discord = require("discord.js");
var config = require("./auth.json");
var mysql = require("mysql");
var db = mysql.createConnection({
    host: config.mysqlHost,
    user: config.mysqlUser,
    password: config.mysqlPass,
    database: config.mysqlDB,
    charset: "utf8mb4"
});

var version = "2016.11.05c";
var mybot = new Discord.Client( { forceFetchUsers : true, autoReconnect : true, disableEveryone: true });
var search;
var nameChangeeNoticesEnabled = true;

var eightBallAnswers = ["it is certain", "it is decidedly so", "without a doubt", "yes, definitely", "you may rely on it",
    "as I see it, yes", "most likely", "outlook good", "yes", "signs point to yes", "reply hazy try again", "ask again later",
    "better not tell you now", "cannot predict now", "concentrate and try again", "don't count on it", "my reply is no", "my sources say no",
    "very doubtful", "lol no", "no way", "odds are about the same as you meeting Taylor", "the probability is the same as Taylor ever getting back together (i.e. never)",
    "http://i.imgur.com/faYfXxE.gif (no)"];

var taylorSwiftSongs = ["Tim McGraw", "Picture to Burn", "Teardrops on My Guitar", "A Place in This World", "Cold As You", "The Outside",
    "Tied Together With a Smile", "Stay Beautiful", "Should've Said No", "Mary's Song", "Our Song", "I'm Only Me When I'm With You",
    "Invisible", "A Perfectly Good Heart", "Jump Then Fall", "Untouchable", "Forever and Always (piano)", "Come In With The Rain", "Superstar",
    "The Other Side of the Door", "Fearless", "Fifteen", "Love Story", "White Horse", "You Belong With Me", "Breathe", "Tell Me Why", "You're Not Sorry",
    "The Way I Loved You", "Forever and Always", "The Best Day", "Change", "Mine", "Sparks Fly", "Back to December", "Speak Now", "Dear John", "Mean", "The Story of Us",
    "Never Grow Up", "Enchanted", "Better Than Revenge", "Innocent", "Haunted", "Last Kiss", "Long Live", "Ours", "If This Was A Movie", "Superman",
    "State of Grace", "Red", "Treacherous", "I Knew You Were Trouble", "All Too Well", "22", "I Almost Do", "We Are Never Ever Getting Back Together",
    "Stay Stay Stay", "The Last Time", "Holy Ground", "Sad Beautiful Tragic", "The Lucky One", "Everything Has Changed", "Starlight", "Begin Again",
    "The Moment I Knew", "Come Back... Be Here", "Girl At Home", "Welcome To New York", "Blank Space", "Style", "Out of the Woods",
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
        db.query("INSERT INTO members (server, id, username, discriminator, lastseen, words, messages) VALUES (?,?,?,?,UNIX_TIMESTAMP(),?,1)" +
            "ON DUPLICATE KEY UPDATE username=?, discriminator=?, lastseen=UNIX_TIMESTAMP(), words=words+?, messages=messages+1, active=1",
            [message.channel.server.id, user.id, user.username, user.discriminator, words, user.username, user.discriminator, words]);
    }
    else
    {
        db.query("INSERT INTO members (server, id, username, discriminator, lastseen) VALUES (?,?,?,?,UNIX_TIMESTAMP())" +
            "ON DUPLICATE KEY UPDATE username=?, discriminator=?, lastseen=UNIX_TIMESTAMP(), active=1",
            [message.channel.server.id, user.id, user.username, user.discriminator, user.username, user.discriminator]);
    }
    
    db.query("INSERT INTO messages (discord_id, date, server, channel, message, author) VALUES (?,now(),?,?,?,?)", [message.id, message.channel.server.id, message.channel.id, message.cleanContent, message.author.id], function (err, result) {
        if (message.mentions.length > 0) {
            var mentioned = [];
            message.mentions.forEach(function (mention) {
                if (mentioned.indexOf(mention.id) >= 0) {
                    return;
                }
                mentioned.push(mention.id);
                var msg = message.cleanContent;
                // Ignore bots if this is the first user mentioned (likely a response to a command initiated by that user)
                if ((inRole(message.channel.server, message.author, "bots") || message.author.id == mybot.user.id) && msg.startsWith("@"+mention.username))
                    return;

                if (!message.channel.permissionsOf(mention).hasPermission('readMessages')) {
                    console.log(mention.username + " has no read access in " + message.channel.name +", skipping.");
                    return;
                }

                db.query("INSERT INTO mentions (message_id, user_id) VALUES (?,?)",
                    [result.insertId, mention.id]);
            });
        }
    });

    // Only allow whitelisted commands in taylordiscussion
    var allowed = ["!mute","!unmute","!kick","!ban","!topic","!supermute","!unsupermute"];
    if (message.channel.id == "131994567602995200" && allowed.indexOf(command[0]) == -1) {
        if (message.content.startsWith('!')) {
            mybot.deleteMessage(message);
        }
        return;
    }

    var nontscommands = ["!8ball","!name","!g","!get","!channelstats","!song","!seen","!words","!save","!mentions","!rankwords","!getlist","!convert","!choose","!delete"];
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
                    mybot.reply(message, "your new name is " + rows[0].name + ".");
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
            db.query("SELECT discriminator, lastseen, active FROM members WHERE server = ? AND username = ?", [message.channel.server.id, search], function (err, rows)
            {
                var response = "";
                for (var i = 0; i < rows.length; i++) {
                    response += search + " ("+rows[i].discriminator+") was last seen " + secondsToTime(Math.floor(new Date() / 1000) - rows[i].lastseen, false) + "ago.";
                    if (rows[i].active == 0)
                    {
                        response += "\nThis person does not appear to be on the member list. This may mean that he or she may have left the server or have been pruned or kicked.\n\n";
                    }
                }
                if (rows.length == 0) {
                    response = "user not found. Please double check the username.";
                }
                mybot.reply(message, response);
            });
            break;
        case "!last":
            if (message.mentions.length > 0)
            {
                search = message.mentions[0].username;
            }
            else
            {
                search = params;
            }
            db.query("SELECT mem.username, mem.discriminator, TIMESTAMPDIFF(SECOND,msg.date,now()) AS messageage, msg.message, msg.id, c.name FROM messages msg " +
                "JOIN members mem ON msg.server=mem.server AND msg.author=mem.id " +
                "JOIN channel_stats c ON msg.channel=c.channel " +
                "WHERE mem.server = ? AND mem.username = ? AND (c.web=1 OR c.server != '115332333745340416') " +
                "ORDER BY msg.id DESC LIMIT 1", [message.channel.server.id, search], function (err, rows)
            {
                var response = "";
                if (rows.length == 0) {
                    response = "no messages found. Please double check the username.";
                } else {
                    response = "Last message by " + rows[0].username + "#" + rows[0].discriminator + " (" + secondsToTime(rows[0].messageage, true) + " ago in " + rows[0].name + " - #" + rows[0].id + ")\n" +
                        rows[0].message;
                }
                mybot.reply(message, response);
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

            db.query("SELECT words, messages, username FROM members WHERE server = ? AND username = ?", [message.channel.server.id, search], function (err, rows)
            {
                if (rows[0] != null)
                {
                    var average = (rows[0].messages > 0) ? Math.round(rows[0].words / rows[0].messages * 100) / 100 : 0;
                    // Don't show message count in main server, TaylorBot has been doing that longer
                    var msgcount = (message.channel.server.id == config.mainServer) ? "" : " in " + rows[0].messages + " messages";
                    mybot.reply(message, rows[0].username + " has used " + rows[0].words + " words" +  msgcount + ". (average " + average + " per message)");
                }
            });
            break;
        case "!rankwords":
            var numberToGet = 5;
            var overflowNotice = false;
            var rankString = "Word Count Ranking:\n";
            if (parseInt(command[1]) > 0 && parseInt(command[1]) < 60)
            {
                numberToGet = parseInt(command[1]);
                if (numberToGet > 10 && (message.channel.id == "115332333745340416" || message.channel.id == "119490967253286912"))
                {
                    numberToGet = 10;
                    overflowNotice = true;
                }
            }
            db.query("SELECT username, words, messages FROM members WHERE server = ? AND words > 0 AND active=1 ORDER BY words DESC LIMIT ?", [message.channel.server.id, numberToGet], function (err, rows)
            {
                var count = 1;
                rows.forEach(function (member) {
                    rankString += count + ": " + member.username + " - " + member.words + " words\n";
                    count++;
                });
                if (overflowNotice) {
                    rankString += "Note: Rankings of more than 10 users can only be used in #bots.";
                }
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
                    db.query("UPDATE data_store SET uses=uses+1, lastused=now() WHERE keyword = ? AND server = ?", [command[1], dataserver]);
                }
            });

            break;
        case "!getlist":
                mybot.reply(message, "https://youregoingtolove.me/fearlessdata.php?server=" + message.channel.server.id);
            break;
        case "!mentions":
            sendNewMentionLog(message);
            mybot.deleteMessage(message);
            break;
        case "!randmember":
            var day = Math.floor(new Date()/1000) - 86400;
            db.query("SELECT username FROM members WHERE lastseen > ? ORDER BY RAND() LIMIT 1", [day], function (err, rows) {
                if (rows != null) {
                    mybot.reply(message, "random member: " + rows[0].username);
                }
            });
            break;
        case "!shitpost":
            var number = parseInt(command[1], 10);
            if (number > 0) {
                db.query("SELECT id, shitpost FROM shitposts WHERE id=?", [number], function (err, rows) {
                    if (rows != null) {
                        mybot.reply(message, rows[0].shitpost + " (#"+rows[0].id+")");
                    }
                });
            } else {
                db.query("SELECT id, shitpost FROM shitposts ORDER BY RAND() LIMIT 1", [], function (err, rows) {
                    if (rows != null) {
                        mybot.reply(message, rows[0].shitpost + " (#"+rows[0].id+")");
                    }
                });
            }
            break;
        case "!activity":
            search  = (message.mentions.length > 0) ? message.mentions[0].id : user.id;
            mybot.reply(message, "https://tay.rocks/activityreport.php?server="+message.channel.server.id+"&user="+search);
            break;
        // Mod commands below
        case "!approve":
            if (isMod(message.channel.server, user))
            {
                db.query("UPDATE data_store SET  approved=1 WHERE keyword = ? AND server = ?", [command[1], message.channel.server.id], function (err, result)
                {
                    if (result.changedRows  > 0)
                    {
                        mybot.reply(message, "approved.");
                        mybot.sendMessage("165309673849880579", "Saved item " + command[1] + " has been approved by " + message.author.username);
                    }
                    else
                    {
                        mybot.reply(message, "nothing to approve.");
                    }
                });
            }
            else
            {
                mybot.reply(message, "nice try. :rolling_eyes:");
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
                        log("Saved item " + command[1] + " has been deleted by " + message.author.username, message.channel.server.id);
                    }
                    else
                    {
                        mybot.reply(message, "keyword not found.");
                    }
                });
            }
            else
            {
                db.query("SELECT owner FROM data_store WHERE server = ? AND keyword = ?", [message.channel.server.id, command[1]], function (err, rows)
                {
                    if (rows[0] == null || rows[0].owner != user.id) {
                        mybot.reply(message, "you can only delete items that you have saved.");
                    } else {
                        db.query("DELETE FROM data_store WHERE server = ? AND keyword = ?", [message.channel.server.id, command[1]]);
                        log("Saved item " + command[1] + " has been deleted by " + message.author.username, message.channel.server.id);
                        mybot.reply(message, "deleted.");
                    }
                });
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
                            mybot.sendMessage("165309673849880579", person.username + " has been kicked by " + message.author.username);
                        }
                        else
                        {
                            mybot.reply(message, ":smirk:");
                        }
                    }
                );
            }
            else
            {
                mybot.reply(message, "nice try. :rolling_eyes:");
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
                            mybot.sendMessage("165309673849880579", person.username + " has been banned by " + message.author.username);
                        }
                        else
                        {
                            mybot.reply(message, ":smirk:");
                        }
                    }
                );
            }
            else
            {
                mybot.reply(message, "nice try. :rolling_eyes:");
            }
            break;
        case "!topic":
            if (isMod(message.channel.server, user) && params !== null)
            {
                mybot.setChannelTopic(message.channel, params);
                mybot.reply(message, "topic updated.");
                log(user.username + " changed the topic in " + message.channel.name + " to " + params,message.channel.server.id);
            }
            else
            {
                mybot.reply(message, "nice try. :rolling_eyes:");
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
                            mybot.sendMessage("165309673849880579", person.username + " has been muted in " + message.channel.name + " by " + message.author.username);
                        }
                        else
                        {
                            mybot.reply(message, ":smirk:");
                        }
                    }
                );
            }
            else
            {
                mybot.reply(message, "nice try. :rolling_eyes:");
            }
            break;
        case "!unmute":
            if (isMod(message.channel.server, user))
            {
                message.mentions.forEach(function (person)
                    {
                        if (!isMod(message.channel.server, person))
                        {
                            mybot.overwritePermissions(message.channel, person, { "sendMessages" : null });
                            mybot.reply(message, person.username + " has been unmuted.");
                            mybot.sendMessage("165309673849880579", person.username + " has been unmuted in " + message.channel.name + " by " + message.author.username);
                        }
                    }
                );

            }
            else
            {
                mybot.reply(message, "nice try. :rolling_eyes:");
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
                            mybot.sendMessage("165309673849880579", person.username + " has been super muted by " + message.author.username);
                        }
                    }
                );
            }
            else
            {
                mybot.reply(message, "nice try. :rolling_eyes:");
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
                            mybot.sendMessage("165309673849880579", person.username + " has been un super muted by " + message.author.username);
                        }
                    }
                );
            }
            else
            {
                mybot.reply(message, "nice try. :rolling_eyes:");
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
                db.query("SELECT id, username, discriminator FROM members WHERE server = ? AND active=1", [message.channel.server.id], function (err, rows)
                {
                    var resultList = "";
                    for (var i=0; i < rows.length; i++)
                    {
                        var member = message.channel.server.members.get("id",rows[i].id);
                        if (member == null)
                        {
                            db.query("UPDATE members SET active=0 WHERE server = ? AND id = ?", [message.channel.server.id, rows[i].id]);
                            resultList += rows[i].username + " (" + rows[i].discriminator + ") - " + rows[i].id + "\n";
                        }
                    }
                    mybot.sendMessage(message.channel, resultList);
                });
            }
            break;
        case "!counter++":
            if (isMod(message.channel.server, user))
            {
                db.query("SELECT * FROM data_store WHERE server='1989' AND keyword=?", [command[1]], function(err, rows)
                {
                    if (rows[0] != null) {
                        rows[0].value++;
                        mybot.reply(message, "woah there. The "+command[1]+" counter is now " + rows[0].value);
                        db.query("UPDATE data_store SET value=value+1 WHERE server='1989' AND keyword=?", command[1]);
                    }
                });
            }
            break;
        case "!counter":
            db.query("SELECT * FROM data_store WHERE server='1989' AND keyword=?", [command[1]], function(err, rows)
            {
                if (rows[0] != null) {
                    mybot.reply(message, "The "+command[1]+" counter is " + rows[0].value);
                }
            });
            break;
        case "!ncon":
            if (inRole(message.channel.server, user, "admins")) {
                nameChangeeNoticesEnabled = true;
                mybot.reply(message, "name notices are now on.");
            }
            break;
        case "!ncoff":
            if (inRole(message.channel.server, user, "admins")) {
                nameChangeeNoticesEnabled = false;
                mybot.reply(message, "name notices are now off.");

            }
            break;
        case "!addshitpost":
            if (inRole(message.channel.server, user, "alpha") || isMod(message.channel.server, user)) {
                db.query("INSERT INTO shitposts (shitpost, addedby, addedon) VALUES (?,?,now())", [params, user.id], function (err, result) {
                    mybot.reply(message, "added #"+result.insertId+".");
                });
            }
            break;
        case "!fbotrestart":
            if (inRole(message.channel.server, user, "admins")) {
                process.exit(-1);
            }
            break;
        case "!version":
            mybot.reply(message, "running version: " + version);
            break;
        case "\uD83D\uDE44":
            if (user.id == 115329261350420487) {
                db.query("UPDATE data_store SET value=value+1 WHERE server='1989' AND keyword='lunaeyeroll'", command[1]);
            }
            break;
    }
});

mybot.on("serverNewMember", function (server, user)
{
    var username = user.username;
    db.query("SELECT * FROM members WHERE server = ? AND id = ?", [server.id, user.id], function (err, rows) {
        if (rows.length > 0) {
            mybot.sendMessage(server.defaultChannel, username + " has rejoined the server. Welcome back!");
            log(username + " (id " + user.id + ") has rejoined the server.",server.id);
        } else {
            mybot.sendMessage(server.defaultChannel, username + " has joined the server. Welcome!");
            log(username + " (id " + user.id + ") has joined the server.",server.id);
        }
    });
});


mybot.on("serverMemberRemoved", function (server, user) {
    db.query("UPDATE members SET active=0 WHERE server = ? AND id = ?", [server.id, user.id]);
    log(user.username + " (id " + user.id + ") has left the server (or was kicked).",server.id);
});

mybot.on("userBanned", function (user, server) {
    log(user.username + " (id " + user.id + ") has been banned.", server.id);
});

mybot.on("messageDeleted", function (message, channel)
{
    if (message == null || message.author.id == '223638525105405952') // bluebot
    {
        return;
    }
    if (message.channel.server.id == config.mainServer)
    {
        var words = message.content.replace(/\s\s+|\r?\n|\r/g, ' ').split(" ").length;
        if (channel.id == '115332333745340416' || channel.id == "119490967253286912" || channel.id == "131994567602995200")
        {
            var removedWords = (words > 20) ? Math.round(words * 1.25) : words; // To help discourage spamming for wordcount
        }
        db.query("UPDATE members SET words=words-?, messages=messages-1 WHERE id=? AND server=?", [removedWords, message.author.id, message.channel.server.id]);
        db.query("UPDATE channel_stats SET total_messages=total_messages-1 WHERE channel = ?", [words, channel.id]);
        db.query("UPDATE messages SET edited=now(), message='(deleted)' WHERE discord_id = ?", [message.id]);
        mybot.sendMessage("165309673849880579","deleted message by " + message.author.username + " in "+message.channel.name+":\n```" + message.cleanContent.replace('`','\\`') + "```");
    }
});

mybot.on("messageUpdated", function (oldMessage, newMessage)
{
    db.query("UPDATE messages SET message=?, edited=now() WHERE discord_id=?", [newMessage.cleanContent, oldMessage.id]);
});

mybot.on("presence", function (oldUser, newUser)
{
    if (oldUser.username != newUser.username)
    {
        db.query("SELECT server, username FROM members WHERE id = ? AND active=1 AND lastseen > UNIX_TIMESTAMP()-604800", [newUser.id], function (err, rows)
        {
            for (var i=0; i < rows.length; i++)
            {
                if (nameChangeeNoticesEnabled)
                {
                    mybot.sendMessage(mybot.servers.get('id',rows[i].server).defaultChannel, rows[i].username + " has changed username to " + newUser.username + ".");
                    if (rows[i].server==config.mainServer)
                    {
                        mybot.sendMessage("165309673849880579", rows[i].username + " has changed username to " + newUser.username + ".");
                    }
                }
                else
                {
                    if (rows[i].server == config.mainServer)
                    {
                        mybot.sendMessage("165309673849880579", rows[i].username + " has changed username to " + newUser.username + ".");
                    }
                    console.log(rows[i].username + " / " + newUser.id +" has changed username to " + newUser.username + ".");
                }
                db.query("UPDATE members SET username=? WHERE id = ?", [newUser.username, newUser.id]);
            }
        });
    }
});

// Bot functionality for PMs
function handlePM(message)
{
    var command = message.content.split(" ");

    switch (command[0].toLowerCase())
    {
        case "!mentions":
            sendNewMentionLog(message);
            break;
        case "le":
            mybot.sendMessage(message.channel, "Good le.");
            break;
        case "xd":
            mybot.sendMessage(message.channel, "http://i.imgur.com/XPuAcUq.png");
            break;
        case "tay":
            mybot.sendMessage(message.channel, "lor");
            break;
        case "!context":
            db.query("(SELECT messages.id, channel, members.username, UNIX_TIMESTAMP(messages.date) AS timestamp, messages.message " +
                "FROM messages JOIN members ON messages.server=members.server AND messages.author=members.id " +
                "WHERE messages.id <= ? AND messages.channel = (SELECT channel FROM messages WHERE id=?) ORDER BY id DESC LIMIT 5) " +
                " UNION " +
                "(SELECT messages.id, channel, members.username, UNIX_TIMESTAMP(messages.date) AS timestamp, messages.message " +
                "FROM messages JOIN members ON messages.server=members.server AND messages.author=members.id " +
                "WHERE messages.id > ? AND messages.channel = (SELECT channel FROM messages WHERE id=?) ORDER BY id LIMIT 4) ORDER BY id ASC", [command[1], command[1], command[1], command[1]], function (err, rows) {
                if (err !== null) {
                    console.log(err);
                }
                var res = '';
                for (var i=0; i < rows.length; i++) {
                    if (mybot.channels.get('id',rows[i].channel).permissionsOf(message.author).hasPermission('readMessages')) {
                        res += rows[i].id + ' ';
                        res += '**<' + rows[i].username + '>** ' + rows[i].message + '\n';
                    } else {
                        mybot.reply(message, "you do not have access to this.");
                        return;
                    }
                }
                mybot.reply(message, res);
            });
            break;
        case "!next":
            db.query("SELECT messages.id, channel, members.username, UNIX_TIMESTAMP(messages.date) AS timestamp, messages.message " +
                "FROM messages JOIN members ON messages.server=members.server AND messages.author=members.id " +
                "WHERE messages.id >= ? AND messages.channel = (SELECT channel FROM messages WHERE id=?) ORDER BY id LIMIT 35", [command[1], command[1], command[1], command[1]], function (err, rows) {
                if (err !== null) {
                    console.log(err);
                }
                var res = '';
                var next = '';
                for (var i=0; i < rows.length; i++) {
                    if (mybot.channels.get('id',rows[i].channel).permissionsOf(message.author).hasPermission('readMessages')) {
                        next = rows[i].id + ' **<' + rows[i].username + '>** ' + rows[i].message + '\n';
                        if ((res.length + next.length) > 1900) {
                            mybot.reply(message, res);
                            return;
                        } else {
                            res += next;
                        }
                    } else {
                        mybot.reply(message, "you do not have access to this.");
                        return;
                    }
                }
                mybot.reply(message, res);
        });
            break;
        case "!prev":
            db.query("(SELECT messages.id, channel, members.username, UNIX_TIMESTAMP(messages.date) AS timestamp, messages.message " +
                "FROM messages JOIN members ON messages.server=members.server AND messages.author=members.id " +
                "WHERE messages.id <= ? AND messages.channel = (SELECT channel FROM messages WHERE id=?) ORDER BY id DESC LIMIT 40) ORDER BY id", [command[1], command[1], command[1], command[1]], function (err, rows) {
                if (err !== null) {
                    console.log(err);
                }
                var res = '';
                var next = '';
                for (var i=0; i < rows.length; i++) {
                    if (mybot.channels.get('id',rows[i].channel).permissionsOf(message.author).hasPermission('readMessages')) {
                        next = rows[i].id + ' **<' + rows[i].username + '>** ' + rows[i].message + '\n';
                        if ((res.length + next.length) > 1900) {
                            mybot.reply(message, res);
                            return;
                        } else {
                            res += next;
                        }
                    } else {
                        mybot.reply(message, "you do not have access to this.");
                        return;
                    }
                }
                mybot.reply(message, res);
            });
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
        if ((isMod(message.channel.server, message.author) || message.channel.server.id != config.mainServer || inRole(message.channel.server, message.author, "alpha") || key == 'tsst') && (rows[0] == null || rows[0]['owner'] == message.author.id))
        {
            db.query("REPLACE INTO data_store (server, keyword, value, owner, approved) VALUES (?,?,?,?,1)", [message.channel.server.id, key, value, message.author.id]);
            mybot.reply(message, "updated and ready to use.");
            log(message.author.username + " created item " + key + " - auto approved",message.channel.server.id);
        }
        else if (rows[0] == null)
        {
            db.query("INSERT INTO data_store (server, keyword, value, owner) VALUES (?,?,?,?)", [message.channel.server.id, key, value, message.author.id]);
            mybot.reply(message, "created. This will need to be approved before it can be used.");
            log(message.author.username + " created item " + key + " - pending approval",message.channel.server.id);
        }
        else if (rows[0]['owner'] == message.author.id)
        {
            db.query("UPDATE data_store SET value = ?, approved=0 WHERE keyword = ? AND server = ?", [value, key, message.channel.server.id]);
            mybot.reply(message, "updated. This will need to be approved before it can be used.");
            log(message.author.username + " updated item " + key + " - pending approval",message.channel.server.id);
        }
        else
        {
            mybot.reply(message, "this keyword already exists.");
        }
    });
}

function sendNewMentionLog(message)
{
    var user = message.author;
    var command = message.content.split(" ");
    var allMessages = [];
    var limit = 5;
    var newlimit = parseInt(command[1]);
    if (newlimit > 0 && newlimit < 100) {
        limit = newlimit;
    }
    db.query("SELECT mentions.message_id, members.username, channel_stats.name, UNIX_TIMESTAMP(messages.date) AS timestamp, messages.message FROM mentions" +
        " JOIN messages ON mentions.message_id = messages.id" +
        " JOIN members ON messages.server=members.server AND messages.author=members.id" +
        " JOIN channel_stats ON messages.server=channel_stats.server AND messages.channel=channel_stats.channel" +
        " WHERE user_id = ?" +
        " ORDER BY mentionid DESC LIMIT ?", [user.id, limit], function (err, rows) {
        console.log(err);
        if (rows.length == 0)
        {
            mybot.sendMessage(user, "No mentions. :(");
            return;
        }
        rows = rows.reverse();
        var msg = "Mention log: \n";
        rows.forEach(function (row) {
            var newmsg = "**" + row.username + " - " + row.name + " - " + secondsToTime(Math.floor(new Date() / 1000) - row.timestamp, true) + "** - #" + row.message_id + "\n";
            newmsg += row.message + "\n\n";

            if (msg.length + newmsg.length > 1900) {
                allMessages.push(msg);
                msg = "Continued:\n";
            }
            msg += newmsg;
        });
        allMessages.push(msg);
        // Due to the way Discord sorts messages, they may appear out of order if messages are sent too swiftly together (<~100ms)
        // So, we add a delay to avoid this.
        for (var i = 0; i < allMessages.length; i++)
        {
            setTimeout(function(time) {
                mybot.sendMessage(user, allMessages[time]);
            }, i*200, i);
        }
        if (!message.channel.isPrivate)
        {
            //mybot.reply(message, "PM sent.");
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
    var africa = server.roles.get("name", "africa");
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
            case "africa":
                mybot.removeMemberFromRole(user, africa);
                break;
        }
    });
}

function updateRegion(message)
{
    var command = message.content.split(" ");
    if (command[1] == null)
    {
        mybot.reply(message, "you need to specify a region. (from: america, europe, asia, africa, oceania)");
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
        case "africa":
            mybot.addMemberToRole(message.author, message.channel.server.roles.get("name", "africa"));
            mybot.reply(message, "your region has been set to Africa.");
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
            mybot.reply(message, "your region has been removed.");
            break;
        default:
            mybot.reply(message, "unrecognized region. Accepted values: america, europe, asia, oceania, africa, clear");
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
    return inRole(server, user, "admins") || inRole(server, user, "mods");
}

function secondsToTime(seconds, short)
{
    var sec = seconds % 60;
    var minutes = Math.floor(seconds / 60) % 60;
    var hours = Math.floor(seconds / 3600) % 24;
    var days = Math.floor(seconds / 86400);

    var result = "";
    if (days > 0)
    {
        result += days + (short ? "d" : " day");
        if (!short) {
            result += days != 1 ? "s " : " ";
        }
    }
    if (hours > 0)
    {
        result += hours + (short ? "h" : " hour");
        if (!short) {
            result += hours != 1 ? "s " : " ";
        }
    }
    if (minutes > 0)
    {
        result += minutes + (short ? "m" : " minute");
        if (!short) {
            result += minutes > 1 ? "s " : " ";
        }
    }
    if(sec > 0)
    {
        result += sec + (short ? "s" : " second");
        if (!short) {
            result += sec != 1 ? "s " : " ";
        }
    }
    return result;
}

function log(message, serverID)
{
    if (serverID == config.mainServer)
    {
        mybot.sendMessage("165309673849880579", message);
    }
}

mybot.loginWithToken(config.token);
