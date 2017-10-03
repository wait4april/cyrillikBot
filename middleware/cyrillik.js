questionPool = JSON.parse(require('fs').readFileSync('data/questions.json', 'utf8'));
goalsPool = JSON.parse(require('fs').readFileSync('data/goals.json', 'utf8'));
sentencesPool = JSON.parse(require('fs').readFileSync('data/sentences.json', 'utf8'));


var assert = require('assert')


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

  ctx.reply('Cyrillik started.')
  console.log("Started for "+message.from.first_name);
  askQuestion(ctx);
}

function askQuestion(ctx){
  var randQuestion = parseInt(Math.random()*1000)%(questionPool.length);
  var randGoals = parseInt(Math.random()*10)%(goalsPool.length);

  var message = ctx.update.message;
  var question={};
  question.data = {};
  question.data.fr=questionPool[randQuestion].fr;
  question.data.ru=questionPool[randQuestion].ru;

  question.goal = goalsPool[randGoals];

  // data = initData(message);
  var data = {};
  data["status"] = true;
  data["question"] = question;

  mongodb.collection('cyrillikData').updateOne({group_id : message.chat.id}, {$set: data},{upsert: true}, function(err, r) {
    assert.equal(null, err);

    switch(question.goal){
      case "rutofr":
        ctx.reply('Translate to French: '+question.data.ru)
        break;
      case "frtoru":
        ctx.reply('Translate to Russian: '+question.data.fr)
        break;
    }
  });
}

function answerQuestion(ctx){
  var message = ctx.update.message;

  mongodb.collection('cyrillikData').find({group_id : message.chat.id}).limit(1).toArray(function(err, docs) {
    assert.equal(null, err);
    try {
      if(docs.length != 1 && docs[0].status == false){
        return false;
      }
    } catch(e){return false;}
    questionData = docs[0].question;

    switch(questionData.goal){
      case "frtoru":
        var correctAnswer = questionData.data.ru;
        break;
      case "rutofr":
        var correctAnswer = questionData.data.fr;
        break;
    }
    var data = {};

    if(cleanAnswer(message.text) == cleanAnswer(correctAnswer)){
      var goodResponse = parseInt(Math.random()*10)%(sentencesPool.goodResponses.length);
      ctx.reply(sentencesPool.goodResponses[goodResponse]);
      try {
        data.totalGoodAnswer = parseInt(docs[0].totalGoodAnswer + 1);
        if(isNaN(data.totalGoodAnswer)){data.totalGoodAnswer = 1;}
      } catch(e) {
        data.totalGoodAnswer = 1;
      }
    } else {
      var badResponse = parseInt(Math.random()*10)%(sentencesPool.badResponses.length);
      ctx.reply(sentencesPool.badResponses[badResponse]+' Correct answer is: '+correctAnswer);
      try {
        data.totalGoodAnswer = parseInt(docs[0].totalGoodAnswer);
        if(isNaN(data.totalGoodAnswer)){data.totalGoodAnswer = 0;}
      } catch(e) {
        data.totalGoodAnswer = 0;
      }
    }
    try {
      data.totalAnswer = parseInt(docs[0].totalAnswer + 1);
      if(isNaN(data.totalAnswer)){data.totalAnswer = 1;}
    } catch(e) {
      data.totalAnswer = 1;
    }
    data.accuracy = updateAccuracy(data.totalAnswer,data.totalGoodAnswer);

    mongodb.collection('cyrillikData').updateOne({group_id : message.chat.id}, {$set: data},{upsert: true}, function(err, r) {
      assert.equal(null, err);
      setTimeout(function(){ askQuestion(ctx); },1000);
    });
  });
}

function cleanAnswer(answer){
  answer = answer.trim();
  answer = answer.replace(/’/g,"'");
  return answer.toLowerCase();
}

function cyrillikStats(ctx){
  var message = ctx.update.message;
  mongodb.collection('cyrillikData').find({group_id : message.chat.id}).limit(1).toArray(function(err, docs) {
    assert.equal(null, err);
    try {
      ctx.reply('Hello '+message.from.first_name+', Your stats are: \
        \nChat ID: '+message.chat.id+' \
        \nAccuracy: '+docs[0]["accuracy"]+'% \
        \nGood answers/Total answers: '+
        docs[0]["totalGoodAnswer"]+'/'+docs[0]["totalAnswer"]
      );
    } catch(e){
      ctx.reply('Hello '+message.from.first_name+',\nI don\'t have enough data for stats yet!\nTry /start !');
      return false;
    }
  });
}

function runCyrillik(ctx){
  answerQuestion(ctx);
}

function initData(message){
  var data = {};
  data["status"] = false;
  data["difficulty"] = "beginner"
  data["totalAnswer"] = 0
  data["totalGoodAnswer"] = 0
  data["accuracy"] = 100
  return data;

}

function updateAccuracy(totalAnswer,totalGoodAnswer){
  if(totalAnswer <= 0){
    var accuracy = 100;
  } else {
    if(totalGoodAnswer <= 0){
      var accuracy = 0;
    } else {
      var accuracy = Math.round(totalGoodAnswer / totalAnswer * 100);
    }
  }
  return accuracy;
}
