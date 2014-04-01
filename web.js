var express = require('express');
var http = require('https');
var logfmt = require('logfmt');
var app = express();

app.use(logfmt.requestLogger());
app.use(express.urlencoded());

app.get('/', function(req, res) {
  res.send('The best bot. The only bot. The not-huebot.');
});

function reply(context, message, icon) {
  var options = {
    host: context.team_domain + '.slack.com',
    port: 443,
    method: 'POST',
    path: '/services/hooks/incoming-webhook?token=' + encodeURIComponent(process.env.SLACK_POST_KEY),
    headers: {'Content-type': 'application/json'}
  };

  var req = http.request(options, function (res) {
    res.on('data', console.log).setEncoding('utf8');
  });
  req.write(JSON.stringify({
    channel: '#' + context.channel_name,
    text: message,
    icon_emoji: ':' + (icon || ghost) + ':'
  }));
  req.end();
}

var intents = require('./intents');
intents.reply = reply;
function handleIntent(context, outcome) {
  if (!outcome) {
    reply(context, "My wit has run out.");
  } else if (intents[outcome.intent]) {
    intents[outcome.intent](context, outcome.entities, outcome.confidence);
  } else {
    reply(context, "I'm confused.");
  }
};

var wit = require('./wit');
app.post('/slack', function (req, res) {
  // token, channel_name, text, team_domain, trigger_word,
  // user_name, channel_id, service_id, user_id, timestamp, team_id
  console.log(req.body.text);
  wit.message(req.body, req.body.text, handleIntent);

  res.send('ok');
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log('Listening on', port);
});
