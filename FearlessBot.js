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
    "I Know Places", "Clean", "Wonderland", "You Are In Love", "New Romantics", "Safe and Sound", "Eyes Open", "Today Was a Fairytale", "Sweeter Than Fiction"];

mybot.on("message", function (message)
{
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
    db.query("INSERT INTO members (id, username, lastseen) VALUES (?,?,UNIX_TIMESTAMP())" +
        "ON DUPLICATE KEY UPDATE username=?, lastseen=UNIX_TIMESTAMP()",[user.id,user.username,user.username]);


    // Check for commands
    switch (command[0])
    {
        case "!fhelp":
            mybot.reply(message, "my commands are:\n!rules displays the rules" +
                "\n!8ball Returns a magic 8 ball answer to a yes/no question\n" +
                "!region (america|europe|asia|oceania) set your region\n" +
                "!stats Returns the total number of messages sent in this channel\n" +
                "!song returns a random Taylor song\n" +
                "!save (keyword) (contents) Saves data that can be easily retrieved later (links, text, etc)\n" +
                "!get (keyword) Retrieves data previously stored using !save");
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
                    "!review (keyword): Same as !get but also shows unapproved items.\n" +
                    "!approve (keyword): approves a stored value\n" +
                    "!getunapproved: lists unapproved items (bs only)\n" +
                    "!delete (keyword): deletes a stored value"
                );
            }
            break;
        case "!rules":
            mybot.reply(message, "rules:\n"
                + "1. \"No matter what happens in life, be good to people. Being good to people is a wonderful legacy to leave behind.\" -Taylor\n"
                + "2. Try not to overuse/spam the bots. It clutters up the chat and disrupts the flows of conversation. For testing/spamming, use the #spamming channel.");
            break;
        case "!region":
        case "!setregion":
            if (command[1] == null)
            {
                mybot.reply(message, "you need to specify a region (from: america, europe, asia, oceania)");
                break;
            }
            command[1] = command[1].toLowerCase();
            clearRegions(message.channel.server, user);
            switch (command[1])
            {
                case "america":
                    mybot.addMemberToRole(user, message.channel.server.roles.get("name", "america"));
                    break;
                case "europe":
                    mybot.addMemberToRole(user, message.channel.server.roles.get("name", "europe"));
                    break;
                case "asia":
                    mybot.addMemberToRole(user, message.channel.server.roles.get("name", "asia"));
                    break;
                case "oceania":
                case "australia":
                    mybot.addMemberToRole(user, message.channel.server.roles.get("name", "oceania"));
                    break;
            }
            mybot.reply(message, "your region has been set.");
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
            db.query("SELECT lastseen FROM members WHERE username = ?", [command[1]], function (err, rows)
            {
                if (rows[0] != null)
                {
                    mybot.reply(message, command[1]+" was last seen " + secondsToTime(Math.floor(new Date() / 1000) - rows[0].lastseen));
                }
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
            db.query("SELECT * FROM data_store WHERE keyword = ? AND approved=1", [command[1]], function (err, rows)
            {
                if (rows[0] == null)
                {
                    mybot.reply(message, "nothing is stored for keyword " + command[1]);
                } else
                {
                    mybot.reply(message, rows[0]['value']);
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
                } else
                {
                    mybot.reply(message, rows[0]['value']);
                }
            });
            break;
        case "!getunapproved":
            if (channel == config.modChannel)
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
                            mybot.kickMember(person, message.channel.server);
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
                mybot.setTopic(message.channel, params);
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
    }
});

mybot.on("serverNewMember", function (server, user)
{
    var taylorswiftmain = server.channels.get("name", "taylorswift");
    var username = user.username;
    mybot.sendMessage(taylorswiftmain, username + " has joined the server. Welcome!");
});

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
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);

    var result = "";
    if (days > 0)
    {
        result += days + " days ";
    }
    if (hours > 0)
    {
        result += hours + " hours ";
    }
    if (minutes > 0)
    {
        result += minutes + " minutes ";
    }
    result += seconds + " seconds";
    return result;
}

mybot.login(config.email, config.password);