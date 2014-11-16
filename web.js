var express = require('express');
var http = require('https');
var logfmt = require('logfmt');
var app = express();

app.use(logfmt.requestLogger());
app.use(express.urlencoded());

app.get('/', function(req, res) {
  res.send('The best bot. The only bot. The not-huebot.');
});

function reply(context, message, icon, name) {
  var options = {
    host: context.team_domain + '.slack.com',
    port: 443,
    method: 'POST',
    path: '/services/hooks/incoming-webhook?token=' + encodeURIComponent(process.env.SLACK_POST_KEY),
    headers: {'Content-type': 'application/json'}
  };
  icon = icon || ':ghost:';

  var req = http.request(options, function (res) {
    res.on('data', console.log).setEncoding('utf8');
  });
  req.write(JSON.stringify({
    channel: '#' + context.channel_name,
    text: message.fallback ? '' : message,
    icon_emoji: (icon[0] == ':') ? icon : null,
    icon_url:   (icon[0] == ':') ? null : icon,
    username: name,
    attachments: message.fallback ? [message] : [],
  }));
  req.end();
}

var intents = require('./intents');
intents.reply = reply;
function handleIntent(context, outcome) {
  if (!outcome) {
    reply(context, "My wit has run out.");
  } else if (outcome.confidence < 0.5) {
    reply(context, "I'm sorry, were you talking about `" + outcome.intent + "`? Please speak up!");
  } else if (intents[outcome.intent]) {
    intents[outcome.intent](context, outcome.entities, outcome.confidence);
  } else {
    reply(context, {
      fallback: JSON.stringify(outcome),
      color: 'warning',
      text: "I don't know how to handle `" + outcome.intent + '` (' + (outcome.confidence*100) + '% confidence)',
      fields: Object.keys(outcome.entities).map(function (entity) {
        console.log(outcome.entities[entity]);
        var value, data = outcome.entities[entity];

        if (data[0])
          value = data.map(function (d) { return d.value; }).join('; ');
        else
          value = data.value;

        return {
          title: entity,
          value: value,
          short: value.length < 50,
        };
      }),
    });
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

app.post('/slack/last', function (req, res) {
  req.body.team_domain = 'twelfthbit';

  intents._users.findOne({user_id: req.body.user_id}, function (err, item) {
    if (err) {
      res.send('Error reading from mongo D:');
      console.log(err);
    } else if (!item || !item.usernames) {
      res.send("I have no dirt on you, bro.");
    } else if (!item.usernames['lastfm'] && !item.usernames['listensws']) {
      res.send("No idea what your lastfm or listens.ws usernames are.");
    } else if (item.usernames['lastfm']) {
      require('./last').lastfm(item.usernames['lastfm'], function (text, img) {
        reply(req.body, text, img || ':cd:', req.body.user_name + ' is listening to');
      });
    } else if (item.usernames['listensws']) {
      require('./last').listensws(item.usernames['listensws'], function (text, img) {
        reply(req.body, text, img || ':cd:', req.body.user_name + ' is listening to');
      });
    }

    res.send('');
  });
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log('Listening on', port);
});
