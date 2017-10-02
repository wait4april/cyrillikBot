console.log("cyrillikBot starting up...");
const Telegraf = require('telegraf');
const {Extra, Markup} = Telegraf;
const config = require('./config');
var cyrillik = require('./middleware/cyrillik');

var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

mongodb = "";// init global mongodb

console.log("Connected to database...");
MongoClient.connect(config.mongodb_url, function(err, db) {
  assert.equal(null, err);

  mongodb = db;
  console.log("Connected correctly to database");

  startTelegraf();

  //db.close();
});


function startTelegraf(){
  console.log("Initializing Telegraf...");
  const bot = new Telegraf(config.telegraf_token);

  bot.telegram.getMe().then((bot_informations) => {
      bot.options.username = bot_informations.username;
      console.log("Bot is running and named: "+bot_informations.username);
  });

  bot.command('help', (ctx) => {ctx.reply('Start: to start\nStop: to stop\nStats: show statistics')});
  bot.command('start', (ctx) => {cyrillik.startBot(ctx);});
  bot.command('stats', (ctx) => {cyrillik.statsBot(ctx);});
  bot.hears(/.*/i, (ctx) => {cyrillik.runBot(ctx);});

  console.log("Initialized")
  console.log("Running cyrillikBot...")
  bot.startPolling();
}
