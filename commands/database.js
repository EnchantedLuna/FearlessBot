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
                message.reply("you have pooped. :poop:\nYour :poop: streak is now " + poopStreak);
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
