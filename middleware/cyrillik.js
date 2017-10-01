questionPool = JSON.parse(require('fs').readFileSync('data/questions.json', 'utf8'));
goalsPool = JSON.parse(require('fs').readFileSync('data/goals.json', 'utf8'));

module.exports = {
  startBot: function(ctx){
    startCyrillik(ctx)
  },
  runBot: function(ctx){
    runCyrillik(ctx)
  },
  statsBot: function(ctx){
    cyrillikStats(ctx);
  }
}

function startCyrillik(ctx){
  var message = ctx.update.message;

  if(!(message.chat.id in data)){
    initData(message);
  }
  data[message.chat.id]["status"]=true;
  ctx.reply('Cyrillik started.')
  console.log("Started for "+message.from.first_name);
  askQuestion(ctx);
}

function askQuestion(ctx){
  var randQuestion = parseInt(Math.random()*1000)%(questionPool.length);
  var randGoals = parseInt(Math.random()*10)%(goalsPool.length);

  var message = ctx.update.message;
  question={};
  question.data = {};
  question.data.fr=questionPool[randQuestion].fr;
  question.data.ru=questionPool[randQuestion].ru;

  question.goal = goalsPool[randGoals];

  data[message.chat.id]["question"] = question;

  switch(question.goal){
    case "rutofr":
      ctx.reply('Translate to French: '+question.data.ru)
      break;
    case "frtoru":
      ctx.reply('Translate to Russian: '+question.data.fr)
      break;
  }
}

function answerQuestion(ctx){
  var message = ctx.update.message;
  switch(data[message.chat.id]["question"].goal){
    case "frtoru":
      var correctAnswer = data[message.chat.id]["question"].data.ru;
      break;
    case "rutofr":
      var correctAnswer = data[message.chat.id]["question"].data.fr;
      break;
  }

  if(cleanAnswer(message.text) == cleanAnswer(correctAnswer)){
    ctx.reply('Perfect :)');
    data[message.chat.id]["totalGoodAnswer"]++;
  } else {
    console.log('Incorrect answer: "'+cleanAnswer(message.text)+'" expected: "'+cleanAnswer(correctAnswer)+'"');
    ctx.reply('Nope :(. Correct answer is: '+correctAnswer);
  }
  data[message.chat.id]["totalAnswer"]++;
  updateAccuracy(message);

  setTimeout(function(){ askQuestion(ctx); },1000);
}

function cleanAnswer(answer){
  answer = answer.trim();
  answer = answer.replace(/’/g,"'");
  return answer.toLowerCase();
}

function cyrillikStats(ctx){
  var message = ctx.update.message;
  if(message.chat.id in data){
    ctx.reply('Hello '+message.from.first_name+', Your stats are: \
      \nChat ID: '+message.chat.id+' \
      \nAccuracy: '+data[message.chat.id]["accuracy"]+'% \
      \nGood answers/Total answers: '+
      data[message.chat.id]["totalGoodAnswer"]+'/'+data[message.chat.id]["totalAnswer"]
    );
  } else {
    initData(message);
    ctx.reply('Hello '+message.from.first_name+',\nI don\'t know this chat yet but now it\'s ready!');
  }
}

function isCyrillikRunning(message){
  try {
    return data[message.chat.id]["status"];
  } catch(e) {
    return false;
  }
}

function runCyrillik(ctx){
  var message = ctx.update.message;
  if(isCyrillikRunning(message)){
    answerQuestion(ctx);
  }
}

function initData(message){
  data[message.chat.id] = {};
  data[message.chat.id]["status"] = false;
  data[message.chat.id]["difficulty"] = "beginner"
  data[message.chat.id]["totalAnswer"] = 0
  data[message.chat.id]["totalGoodAnswer"] = 0
  data[message.chat.id]["accuracy"] = 100
}

function updateAccuracy(message){
  if(data[message.chat.id]["totalAnswer"] <= 0){
    data[message.chat.id]["accuracy"] = 100;
  } else {
    if(data[message.chat.id]["totalGoodAnswer"] <= 0){
      data[message.chat.id]["accuracy"] = 0;
    } else {
      data[message.chat.id]["accuracy"] = data[message.chat.id]["totalGoodAnswer"] / data[message.chat.id]["totalAnswer"] * 100;
    }
  }
}
