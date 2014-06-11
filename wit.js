var http = require('https');

exports.message = function (context, line, cb) {
  var options = {
    host: 'api.wit.ai',
    path: '/message?q=' + encodeURIComponent(line),
    headers: {
      Authorization: 'Bearer ' + process.env.WIT_KEY,
      Accept: 'application/vnd.wit.20140610',
    }
	};

	http.get(options, function(res) {
    var buffer = '';
    res.on('data', function (chunk) {
      buffer += chunk;
    }).setEncoding('utf8');

    res.on('end', function () {
      if (buffer.length) {
        var data = JSON.parse(buffer);
        cb(context, data.outcome);
      } else {
        cb(context, null);
      }
    });
  });
}
