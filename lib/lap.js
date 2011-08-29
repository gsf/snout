var dgram = require('dgram');
var fs = require('fs');
var http = require('http');
var url = require('url');

var socket = dgram.createSocket('unix_dgram');

exports.log = function(message) {
  buffer = new Buffer('ta[' + process.pid + ']: ' + message);
  socket.send(buffer, 0, buffer.length, '/dev/log', function(err, bytes) {
    if (err) {
      throw err;
    }
    console.log('Wrote ' + bytes + ' bytes to the socket.');
  });
};

exports.templates = {};

exports.loadTemplates = function(templateDir) {
  var file;
  var files = fs.readdirSync(templateDir);
  for (var i=0, l=files.length; i<l; i++) {
    file = files[i];
    exports.templates[file.replace(/\.html$/, '')] = fs.readFileSync(templateDir+'/'+file);
  }
};

exports.routes = [];

exports.route = function(re, cb) {
  exports.routes.push({re: re, cb: cb});
};

exports.listen = function(port) {
  http.createServer(function(req, res) {
    var path = url.parse(req.url).pathname;
    var route, ret404 = true;
    for (var i=0, l=exports.routes.length; i<l; i++) {
      route = exports.routes[i];
      if (route.re.test(path)) {
        ret404 = false;
        route.cb(req, res, route.re.exec(path));
        break;
      }
    }
    if (ret404) {
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end('404');
    }
  }).listen(port);
  console.log('Server running at '+port);
};
