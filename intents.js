var mongo = require('mongodb');

exports.weather = function (context, entities) {
  exports.reply(context, "It's sunny, bitch.", 'sunny');
};

mongo.connect(process.env.MONGOLAB_URI, {}, function(error, db) {
  console.log('MongoLAB connected:', error);
  db.collection('users', function (err, users) {

    exports.set_service_username = function (context, entities) {
      if (!entities.service) {
        return exports.reply(context, 'Dude name a service');
      } else if (!entities.username) {
        return exports.reply(context, "I didn't catch your username");
      }

      var doc = { user_id: context.user_id, user_name: context.user_name };
      doc[entities.service.value] = entities.username.value;

      users.update({user_id: context.user_id}, doc, {upsert: true}, function (err, item) {
        if (err) {
          exports.reply(context, 'Error saving to mongo :(');
        } else {
          exports.reply(context, 'I gotcha, @' + context.user_name + '! ' +
              entities.username.value + ' on ' + entities.service.value);
        }
      });
    };

  });
});
