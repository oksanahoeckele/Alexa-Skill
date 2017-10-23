
const Alexa = require('alexa-sdk');
const https = require('https');

let rails_app_endpoint = 'https://desolate-falls-54173.herokuapp.com/courses/13.json'
let questionList = null;

function setQuestionList(alexa, cb){
  console.log('setting the question list, ' + rails_app_endpoint);
  https.get(rails_app_endpoint, (res) => {
    console.log('response arrived');
    const { statusCode } = res;
    const contentType = res.headers['content-type'];

    let error;
    if (statusCode !== 200) {
      error = new Error('Request Failed.\n' +
      `Status Code: ${statusCode}`);
    } else if (!/^application\/json/.test(contentType)) {
      error = new Error('Invalid content-type.\n' +
      `Expected application/json but received ${contentType}`);
    }

    if (error) {
      console.error(error.message);
      console.log(error.message);
      // consume response data to free up memory
      res.resume();
      return;
    }

    // res.setEncoding('utf8');
    let rawData = '';

    res.on('data', (chunk) => { console.log('grabbing data'); rawData += chunk; });
    res.on('end', () => {
      console.log('response is ending');
      try {
        alexa.attributes['questionList'] =  JSON.parse(rawData);
        console.log(alexa.attributes['questionList']);
        if (cb) { cb(); }
      } catch (e) {
        console.error(e.message);
      }
    });
  }).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
  });} // immediately invoked function, "iffy"


const languageStrings = {
    'en-US': {
        'translation': {
            'TITLE'  : "Xlearn",
            'WELCOME_LAUNCH':  "Welcome to xLearn: We are offering a solution to improve your language skills: what is you rnative language?",
            'WELCOME_PRACTICE': '<audio src="https://s3.amazonaws.com/xlearnaudio/intro4.mp3"/>',
            'HELP_MESSAGE': "Okay let's practice: this lesson will focus on teaching you how to order some food in a restaurant: Are you ready to start?",
        }
    },
};

// const _questionList = [
//     { question:"no this is my 1st time here",             answer:["no this is my 1st time here"]},
//     { question:"sure why not",                            answer:["sure why not"]},
//     { question:"sounds good I would like some steak",     answer:["sounds good I would like some steak"]},
//     { question:"medium rare",                             answer:["medium rare"]},
//     { question:"just some water please",                  answer:["just some water please"]},
//     { question:"great",                                   answer:["great"]},
//     { question:"no just bring the check please",          answer:["no just bring the check please"]},
// ];




const options = {
    // QUESTIONS_PER_QUIZ: questionList.length,
    // TITLE: 'Xlearn'
};


exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);

    alexa.resources = languageStrings;

    // alexa.appId = 'amzn1.echo-sdk-ams.app.1234';
    ///alexa.dynamoDBTableName = 'YourTableName'; // creates new table for session.attributes

    alexa.registerHandlers(
          newSessionHandlers

        , startSessionHandlers

        , practiceHandlers

        , recapPracticeHandlers

        , scoreHandlers
    );
    alexa.execute();
};


const states = {
    START:           "_START",

    PRACTICE:        "_PRACTICE",
    // QUIZ:            "_QUIZ",

    RECAP_PRACTICE:  "_RECAP_PRACTICE",
    // RECAP_QUIZ:      "_RECAP_QUIZ",
};

const newSessionHandlers = {
    'NewSession': function() {
        this.handler.state = states.START;
        this.emitWithState('NewSession');
    }
};

const startSessionHandlers = Alexa.CreateStateHandler(states.START, {
    'NewSession': function() {

        // this.attributes['questionList'] = questionList;
        this.attributes['correctCount'] = 0;
        this.attributes['wrongCount'] = 0;
        this.attributes['wrongList'] = [];

        this.response.speak(this.t('WELCOME_LAUNCH')).listen(this.t("TITLE"));
        this.emit(':responseReady');

    },

    "PracticeIntent": function() {
        this.handler.state = states.PRACTICE;
        setQuestionList(this, function() {
          console.log('question list');
          console.log(this.attributes['questionList'] );
          this.response.speak(this.t("WELCOME_PRACTICE", this.attributes['questionList'].length))
              .listen(this.t("WELCOME_PRACTICE", this.attributes['questionList'].length));
          this.emit(':responseReady');
        }.bind(this));
    },

    "AMAZON.HelpIntent": function() {
        this.response.speak(this.t("HELP_MESSAGE", this.attributes['questionList'].length, options.QUESTIONS_PER_QUIZ))
            .listen(this.t("HELP_MESSAGE", this.attributes['questionList'].length, options.QUESTIONS_PER_QUIZ));
        this.emit(':responseReady');
    },
    "AMAZON.CancelIntent": function() {
        this.response.speak("Goodbye!")
        this.emit(':responseReady');
    },
    "AMAZON.StopIntent": function() {
        this.response.speak("Goodbye!");
        this.emit(':responseReady');
    }

});

const practiceHandlers = Alexa.CreateStateHandler(states.PRACTICE, {
    'NewSession': function () {
        this.emit('NewSession'); // Uses the handler in newSessionHandlers
    },
    'AMAZON.YesIntent': function() {  // Yes, I want to start the practice

        var say = '';

        this.attributes['currentQuestionIndex'] = 0;

        if (this.attributes['wrongList'].length > 0) {  // we have taken the practice already and need to repeat
            // this.attributes['sessionQuestionList'] = this.attributes['wrongList'];  // only practice those answered wrong
            this.attributes['wrongList'] = [];
            this.attributes['wrongCount'] = 0;
            this.attributes['correctCount'] = 0;
        } else {
            this.attributes['sessionQuestionList'] = this.attributes['questionList'];
        }
        // say = 'First phrase is ' + this.attributes['sessionQuestionList'] + ', '
        say = 'Listen to the waiter and repeat after me: ' + this.attributes['sessionQuestionList'][0].question + '.';

        this.response.speak(say).listen(say);
        this.emit(':responseReady');
    },

    'AnswerIntent': function() {
        var myState = '';

        if ( !this.event.request.intent.slots.phrase || this.event.request.intent.slots.phrase.value == '') {
            this.emitWithState('AMAZON.HelpIntent');  // emitWithState = local version of this handler

        } else {
            myState = this.event.request.intent.slots.phrase.value;

            this.emit('rateAnswer', myState, (say) => {

                var currentQuestionIndex = this.attributes['currentQuestionIndex'];

                if (currentQuestionIndex < this.attributes['sessionQuestionList'].length) {  // MORE QUESTIONS
                    say = say + this.attributes['sessionQuestionList'][currentQuestionIndex].question + '? ';
                    this.response.speak(say).listen(say);
                    this.emit(':responseReady');

                } else {   // YOU ARE DONE

                    this.handler.state = states.RECAP_PRACTICE;
                    this.emitWithState('RecapSession', say);
                }

            });
        }

    },

    'AMAZON.StopIntent': function () {
        this.response.speak('Goodbye');
        this.emit(':responseReady');
    },
    'AMAZON.HelpIntent': function () {  // practice help
        var helpText = 'please repeat the exact phrase';
        this.response.speak(helpText);
        this.emit(':responseReady');
    },

    'Unhandled': function() {  // if we get any intents other than the above
        this.response.speak('Sorry, I didn\'t get that.').listen('Try again');
        this.emit(':responseReady');
    }
});

const recapPracticeHandlers = Alexa.CreateStateHandler(states.RECAP_PRACTICE, {
    'NewSession': function () {
        this.emit('NewSession'); // Uses the handler in newSessionHandlers
    },
    'RecapSession': function (say) {  // append final results to previous answer result

        say = say + ' You are done. You got '
            + this.attributes['correctCount']
            + ' right out of '
            + this.attributes['sessionQuestionList'].length + '. ';

        if (this.attributes['wrongCount'] == 0) {
            say += ' Great job!  You can say stop if you are done.';
            this.response.speak(say).listen(say);
            this.emit(':responseReady');

        } else {
            say = say   +  ' I have sent the '
                        + pluralize('question', this.attributes['wrongCount'])
                        + ' you got wrong to the Alexa app. ';
            say += ' Say stop to exit';

            var cardText = '';
            var wrongList = this.attributes['wrongList'];
            for (var i = 0; i < wrongList.length; i++) {
                cardText += '\n\nQuestion : ' + wrongList[i].question;
                cardText += '\nAnswer   : ' + wrongList[i].answer[0];  // show the first acceptable answer
            }

            this.response.cardRenderer('Flash Cards to Practice', cardText);
            this.response.speak(say).listen('You can say yes to practice, or say no.');
            this.emit(':responseReady');
        }

    },

    'AMAZON.StopIntent': function () {  //
        var say = 'Okay, see you next time, goodbye!';
        this.response.speak(say);
        this.emit(':responseReady');
    },
    'Unhandled': function() {
        this.response.speak('Sorry, I didn\'t get that. Try again.').listen('Try again.');
        this.emit(':responseReady');
    }
});

const scoreHandlers = {
    'rateAnswer': function (stateGuess, callback) {

        var currentQuestionIndex = this.attributes['currentQuestionIndex'];
        var currentQuestion = this.attributes['sessionQuestionList'][currentQuestionIndex];
        if (currentQuestion.answer.indexOf(stateGuess) >= 0 ) {


            say = stateGuess + ' is right! ';
            this.attributes['correctCount'] += 1;
        } else {

            this.attributes['wrongCount'] += 1;

            var wrongList = this.attributes['wrongList'];
            wrongList.push(currentQuestion);
            this.attributes['wrongList'] = wrongList;

            say =  stateGuess + ' is wrong! '
                + "The answer was "
                + currentQuestion.answer[0] + '. ';

        }
        currentQuestionIndex += 1;
        this.attributes['currentQuestionIndex'] = currentQuestionIndex;

        callback(say);
    },
};

function randomizeArray(myArray, recordCount) { // Fisher-Yates shuffle
    var sliceLimit = myArray.length;
    if (recordCount) {
        sliceLimit = recordCount;
    }
    var m = myArray.length, t, i;

    // While there remain elements to shuffle…
    while (m) {

        // Pick a remaining element…
        i = Math.floor(Math.random() * m--);

        // And swap it with the current element.
        t = myArray[m];
        myArray[m] = myArray[i];
        myArray[i] = t;
    }

    return myArray.slice(0, sliceLimit);

}
function pluralize(word, qty) {
    var newWord = '';
    if (qty == 1) {
        newWord = word;
    } else {
        newWord = word + 's';
    }
    return qty.toString() + ' ' + newWord;
}
