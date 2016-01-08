var Discord = require("discord.js");
var config = require("./auth.json");
var mysql = require("mysql");
var db = mysql.createConnection({
    host: config.mysqlHost,
    user: config.mysqlUser,
    password: config.mysqlPass,
    database: config.mysqlDB
});

var mybot = new Discord.Client();
var search;

var eightBallAnswers = ["It is certain", "It is decidedly so", "Without a doubt", "Yes, definitely", "You may rely on it",
    "As I see it, yes", "Most likely", "Outlook good", "Yes", "Signs point to yes", "Reply hazy try again", "Ask again later",
    "Better not tell you now", "Cannot predict now", "Concentrate and try again", "Don't count on it", "My reply is no", "My sources say no",
    "Very doubtful"];

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
    var user = message.author;
    var channel = message.channel.name;
    var command = message.content.split(" ");
    var params = command.slice(1, command.length).join(" ");

    // Increment total count
    db.query(
        'UPDATE channel_stats SET total_messages=total_messages+1 WHERE channel = ?',
        [message.channel.id]
    );

    // Check user info
    var words = command.length;
    if (message.channel.id == "115332333745340416" || message.channel.id == "119490967253286912" || message.channel.id == "131994567602995200")
    {
        db.query("INSERT INTO members (id, username, lastseen, words, messages) VALUES (?,?,UNIX_TIMESTAMP(),?,1)" +
            "ON DUPLICATE KEY UPDATE username=?, lastseen=UNIX_TIMESTAMP(), words=words+?, messages=messages+1",
            [user.id, user.username, words, user.username, words]);
    }
    else
    {
        db.query("INSERT INTO members (id, username, lastseen) VALUES (?,?,UNIX_TIMESTAMP())" +
            "ON DUPLICATE KEY UPDATE username=?, lastseen=UNIX_TIMESTAMP()",
            [user.id, user.username, user.username]);
    }

    // Only allow whitelisted commands in serious
    var allowed = ["!mute","!unmute","!kick","!ban","!unban","!topic","!supermute","!unsupermute"];
    if (message.channel.id == "131994567602995200" && allowed.indexOf(command[0]) == -1) {
        return;
    }


    // Check for commands
    switch (command[0])
    {
        case "!fhelp":
            mybot.reply(message, "my commands are:\n" +
                "!rules displays the rules\n" +
                "!fhelp returns this message (wow such meta)\n" +
                "!8ball Returns a magic 8 ball answer to a yes/no question\n" +
                "!region (america|europe|asia|oceania) set your region\n" +
                "!stats Returns the total number of messages sent in this channel\n" +
                "!song returns a random Taylor song\n" +
                "!save (keyword) (contents) Saves data that can be easily retrieved later (links, text, etc)\n" +
                "!get (keyword) Retrieves data previously stored using !save\n" +
                "!seen (username) Gets the time a person has last sent a message.\n" +
                "!words (username) Gets the word count statistics for the person.\n" +
                "!rankwords (count): Ranks members by words used, up to the amount specified"
            );
            break;
        case "!fhelpmod":
            if (isMod(message.channel.server, user) && channel == config.modChannel)
            {
                mybot.reply(message, "my mod commands are:\n" +
                    "!kick @person: Kick member\n" +
                    "!ban @person: Ban member\n" +
                    "!unban @person: Unban member\n" +
                    "!topic (topic): Set topic\n" +
                    "!mute/unmute @member: mute/unmute member (prevents from sending messages)\n" +
                    "!supermute/!unsupermute @member: like mute, but applies to all channels\n" +
                    "!review (keyword): Same as !get but also shows unapproved items.\n" +
                    "!approve (keyword): approves a stored value\n" +
                    "!getunapproved: lists unapproved items\n" +
                    "!delete (keyword): deletes a stored value"
                );
            }
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
            mybot.reply(message, answer);
            break;
        case "!song":
            var song = taylorSwiftSongs[Math.floor(Math.random() * taylorSwiftSongs.length)];
            mybot.reply(message, "you should listen to " + song);
            break;
        case "!stats":
            db.query("SELECT * FROM channel_stats WHERE channel = ?", [message.channel.id], function (err, rows)
            {
                var total = rows[0].total_messages;
                mybot.reply(message, "there have been " + total + " messages sent since December 5, 2015 in this channel.");
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
            db.query("SELECT lastseen FROM members WHERE username = ?", [search], function (err, rows)
            {
                if (rows[0] != null)
                {
                    mybot.reply(message, search + " was last seen " + secondsToTime(Math.floor(new Date() / 1000) - rows[0].lastseen) + "ago.");
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

            db.query("SELECT words, messages FROM members WHERE username = ?", [search], function (err, rows)
            {
                if (rows[0] != null)
                {
                    var average = (rows[0].messages > 0) ? Math.round(rows[0].words / rows[0].messages * 100) / 100 : 0;
                    mybot.reply(message, search + " has used " + rows[0].words + " words (average " + average + " per message)");
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
            db.query("SELECT username, words, messages FROM members WHERE words > 0 ORDER BY words DESC LIMIT ?", [numberToGet], function (err, rows)
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
            db.query("SELECT * FROM data_store WHERE keyword = ?", [command[1]], function (err, rows)
            {
                if (isMod(message.channel.server, user))
                {
                    db.query("REPLACE INTO data_store (keyword, value, owner, approved) VALUES (?,?,?,1)", [key, value, user.id]);
                    mybot.reply(message, "updated and ready to use.");
                }
                else if (rows[0] == null)
                {
                    db.query("INSERT INTO data_store (keyword, value, owner) VALUES (?,?,?)", [key, value, user.id]);
                    mybot.reply(message, "created. This will need to be approved before it can be used.");
                }
                else if (rows[0]['owner'] == user.id)
                {
                    db.query("UPDATE data_store SET value = ?, approved=0 WHERE keyword = ?", [value, key]);
                    mybot.reply(message, "updated. This will need to be approved before it can be used.");
                }
                else
                {
                    mybot.reply(message, "this keyword already exists.");
                }
            });
            break;
        case "!g":
        case "!get":
            if (command[1] == null)
                return;
            db.query("SELECT * FROM data_store WHERE keyword = ?", [command[1]], function (err, rows)
            {
                if (rows[0] == null)
                {
                    mybot.reply(message, "nothing is stored for keyword " + command[1]);
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
        case "!approve":
            if (isMod(message.channel.server, user))
            {
                db.query("UPDATE data_store SET  approved=1 WHERE keyword = ?", [command[1]]);
                mybot.reply(message, "approved.");
            }
            else
            {
                mybot.reply(message, "nice try.");
            }
            break;
        case "!delete":
            if (isMod(message.channel.server, user))
            {
                db.query("DELETE FROM data_store WHERE keyword = ?", [command[1]], function (err, result)
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
            db.query("SELECT * FROM data_store WHERE keyword = ?", [command[1]], function (err, rows)
            {
                if (rows[0] == null)
                {
                    mybot.reply(message, "nothing is stored for keyword " + command[1]);
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
                    mybot.reply(message, "unapproved: " + list);
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
    }
});

mybot.on("serverNewMember", function (server, user)
{
    var username = user.username;
    mybot.sendMessage("115332333745340416", username + " has joined the server. Welcome!");
});

// Bot functionality for PMs
function handlePM(message)
{
    var command = message.content.split(" ");
    var params = command.slice(1, command.length).join(" ");

    if (command[0] == "!mods")
    {
        var modChannel = mybot.servers.get("id", config.mainServer).channels.get("name", config.modChannel);
        mybot.sendMessage(modChannel, "PM from " + message.author.username + ": " + params);
        mybot.sendMessage(message.channel, "your message has been sent to the mods.");
    }
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
        mybot.reply(message, "you need to specify a region (from: america, europe, asia, oceania)");
        return;
    }
    command[1] = command[1].toLowerCase();
    clearRegions(message.channel.server, message.author);
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
        default:
            mybot.reply(message, "unrecognized region. Your region settings has been reset.");
            break;
    }
}

function inRole(server, user, needle)
{
    var roles = server.rolesOfUser(user);
    var inRole = false;
    roles.forEach(function (role)
    {
        if (role.name == needle)
        {
            inRole = true;
        }
    });
    return inRole;
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

mybot.login(config.email, config.password);
