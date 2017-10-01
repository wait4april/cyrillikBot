const Telegraf = require('telegraf');
const {Extra, Markup} = Telegraf;
const config = require('./config');
var cyrillik = require('./middleware/cyrillik');

const bot = new Telegraf(config.telegraf_token);
data = {};

bot.telegram.getMe().then((bot_informations) => {
    bot.options.username = bot_informations.username;
    console.log("Server has initialized bot nickname. Nick: "+bot_informations.username);
});

bot.command('help', (ctx) => {ctx.reply('Start: to start\nStop: to stop\nStats: show statistics')});
bot.command('start', (ctx) => {cyrillik.startBot(ctx);});
bot.command('stats', (ctx) => {cyrillik.statsBot(ctx);});
bot.hears(/.*/i, (ctx) => {cyrillik.runBot(ctx);});


bot.startPolling();
