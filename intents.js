var mongo = require('mongodb');
var moment = require('moment');

exports.weather = function (context, entities) {
  exports.reply(context, "It's sunny, bitch.", ':sunny:');
};

exports.time = function (context, entities) {
  if (entities && entities.assertion) {
    var from = moment(entities.assertion.value.from),
        to   = moment(entities.assertion.value.to),
        now  = moment();
    
    if (from.isAfter(now)) {
      exports.reply(context, "It's not " + entities.assertion.body + " for another " + from.fromNow() + " :(");
    } else if (to.isBefore(now)) {
      exports.reply(context, "It was " + entities.assertion.body + " like " + from.fromNow() + " :(");
    } else {
      exports.reply(context, "It's " + entities.assertion.body + " already, and for another " + from.fromNow() + "!");
    }
    
  } else {
    var now  = moment(),
        time = now.format('h:mm:ss a'),
        date = now.format('dddd, MMMM Do, YYYY');

    exports.reply(context, "It's " + time + " on " + date);
  }
};

mongo.connect(process.env.MONGOLAB_URI, {}, function(error, db) {
  console.log('MongoLAB connected:', error);
  db.collection('users', function (err, users) {
    exports._users = users;

    exports.set_service_username = function (context, entities) {
      if (!entities.service) {
        return exports.reply(context, 'Dude name a service');
      } else if (!entities.username) {
        return exports.reply(context, "I didn't catch your username");
      }

      var doc = { user_id: context.user_id, user_name: context.user_name };
      doc['usernames.' + entities.service.value] = entities.username.value;

      users.update({user_id: context.user_id}, {$set:doc}, {upsert: true}, function (err, item) {
        if (err) {
          exports.reply(context, 'Error saving to mongo :(');
          console.log(err);
        } else {
          exports.reply(context, 'I gotcha, @' + context.user_name + '! ' +
              entities.username.value + ' on ' + entities.service.value);
        }
      });
    };

    exports.get_identity = function (context, entities) {
      users.findOne({user_id: context.user_id}, function (err, item) {
        if (err) {
          exports.reply(context, 'Error reading from mongo :(');
          console.log(err);
        } else if (!item || !item.usernames) {
          exports.reply(context, "I have no dirt on you, bro.");
        } else if (!entities.service) {
          exports.reply(context, "Your accounts: " + JSON.stringify(item.usernames));
        } else if (!item.usernames[entities.service.value]) {
          exports.reply(context, "You never told me your " + entities.service.value);
        } else {
          exports.reply(context, "Your " + entities.service.value + " is " + item.usernames[entities.service.value]);
        }
      });
    };

    exports.get_someones_username = function (context, entities) {
      if (!entities.service) {
        return exports.reply(context, 'Dude what service?');
      } else if (!entities.username) {
        return exports.reply(context, "I didn't catch a username");
      }

      users.findOne({user_name: entities.username.value}, function (err, item) {
        if (err) {
          exports.reply(context, 'Error reading from mongo :(');
          console.log(err);
        } else if (!item || !item.usernames) {
          exports.reply(context, "I have no dirt on " + entities.username.value + ", bro.");
        } else if (!item.usernames[entities.service.value]) {
          exports.reply(context, "No idea what " + entities.username.value + "'s " + entities.service.value + " is.");
        } else {
          exports.reply(context, entities.username.value + "'s " + entities.service.value + " is " + item.usernames[entities.service.value]);
        }
      });
    };

    exports.play_history = function (context, entities) {
      var username = entities.username ? entities.username.value : context.user_name;

      users.findOne({user_name: username}, function (err, item) {
        if (err) {
          res.send('Error reading from mongo!');
          console.log(err);
        } else if (!item || !item.usernames) {
          res.send("I have no dirt on " + username + ", bro.");
        } else if (!item.usernames['lastfm'] && !item.usernames['listensws']) {
          res.send("No idea what " + username + "'s lastfm or listens.ws usernames are.");
        } else if (item.usernames['lastfm']) {
          require('./last').lastfm(item.usernames['lastfm'], function (text, img) {
            exports.reply(context, username + " was listening to " + text, img || ':cd:');
          });
        } else if (item.usernames['listensws']) {
          require('./last').listensws(item.usernames['listensws'], function (text, img) {
            exports.reply(context, username + " was listening to " + text, img || ':cd:');
          });
        }
      });
    }
  });
});
