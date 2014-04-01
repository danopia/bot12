var mongo = require('mongodb');

exports.weather = function (context, entities) {
  exports.reply(context, "It's sunny, bitch.", 'sunny');
};

mongo.connect(process.env.MONGOLAB_URI, {}, function(error, db) {
  console.log('MongoLAB connected:', error);
  db.collection('users', function (err, users) {

    exports.set_service_username = function (context, entities) {
      var doc = {};
      doc[entities.service.value] = entities.username.value;

      users.update({user_id: context.user_id}, doc, {upsert: true}, function (err, item) {
        if (err) {
          reply(context, 'Error saving to mongo');
        } else {
          reply(context, 'I gotcha!');
        }
      });
    };

  });
});
