var http = require('https');
var moment = require('moment');

exports.lastfm = function (user, cb) {
  var opts = {
    host: 'ws.audioscrobbler.com',
    path: '/2.0/?method=user.getrecenttracks&user=' + encodeURIComponent(user) + '&limit=1&api_key=' + process.env.LASTFM_KEY + '&format=json'
  };

  http.get(opts, function (res) {
    var buffer = ''
    res.on('data', function (chunk) {
      buffer += chunk;
    }).setEncoding('utf8');

    res.on('end', function () {
      var json = JSON.parse(buffer);
      var track = json.recenttracks.track;
      if (track[0]) track = track[0];

      // console.log(track);
      var song = '<' + track.url + '|' + track.name + '>';
      var artist = track.artist ? track.artist['#text'] : 'unknown';
      var album = track.album ? track.album['#text'] : 'unknown';

      var img = (track.image && track.image.length) ? track.image[0]['#text'] : null;
      cb([artist, song, album].join(' — ') + ' [<http://last.fm/user/' + user + '|last.fm>]', img);
    })
  });
};

var Listens = require('listens');
var publicClient = new Listens.PublicClient();

exports.listensws = function (user, cb) {
  publicClient.getListens(user, { limit: 1 }, function(err, listens, count, user) {
    if (err) return;

    var listen = listens[0];
    if (!listen) return;

    var np = [listen.artist, listen.title, listen.album].join(' — ');
    np += ' [';
    if (listen.skippedAt)
      np += 'skipped ' + moment(listen.skippedAt).fromNow();
    else
      np += moment(listen.listenedAt).fromNow();
    np += ']';

    cb(np);
  });
};
