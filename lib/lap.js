// lap -- a lightweight app framework for Node

var dgram = require('dgram');
var fs = require('fs');
var http = require('http');
var url = require('url');

var App = function(name) {
  this.name = name;
  this.templates = {};
  this.routes = [];
};

// log to syslog
var socket = dgram.createSocket('unix_dgram');
App.prototype.log = function(message) {
  buffer = new Buffer(this.name+'[' + process.pid + ']: ' + message);
  socket.send(buffer, 0, buffer.length, '/dev/log', function(err, bytes) {
    if (err) {
      throw err;
    }
    console.log('Wrote ' + bytes + ' bytes to the socket.');
  });
};

// make templates available at app.templates
App.prototype.loadTemplates = function(templateDir) {
  var file;
  var files = fs.readdirSync(templateDir);
  for (var i=0, l=files.length; i<l; i++) {
    file = files[i];
    this.templates[file.replace(/\.html$/, '')] = fs.readFileSync(templateDir+'/'+file);
  }
};

// route map functions to path regexes
App.prototype.route = function(re, cb) {
  this.routes.push({re: re, cb: cb});
};

App.prototype.listen = function(port) {
  var that = this;
  http.createServer(function(req, res) {
    var path = url.parse(req.url).pathname;
    var route, ret404 = true;
    for (var i=0, l=that.routes.length; i<l; i++) {
      route = that.routes[i];
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

exports.app = function(name, templates) {
  var a = new App(name);
  a.loadTemplates(templates);
  return a;
};
