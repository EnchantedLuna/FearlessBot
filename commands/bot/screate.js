exports.run = function (message, args, bot, db) {
    bot.api.applications('346098983543898113').guilds('166329346720661504').commands.post({data: {
        name: 'totals',
        description: 'Get the total message stats for the server'
    }})
}