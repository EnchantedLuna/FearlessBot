exports.run = function (message, args, bot, db) {
    bot.api.applications('346098983543898113').guilds('166329346720661504').commands.post({data: {
        name: 'acronym',
        description: 'Look up a Taylor Swift song acronym',
        options: [
            {
                "name" : "term",
                "description" : "The acronym that you want to look up",
                "required" : true,
                "type" : 3
            }
        ]
    }})
}