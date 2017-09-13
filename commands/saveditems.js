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
