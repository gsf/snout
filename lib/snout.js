// snout -- a lightweight app framework for Node

var fs = require('fs');
var http = require('http');
var url = require('url');

var App = function() {
  this.templates = {};
  this.routes = [];
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

// each route maps a callback to a regular expression
App.prototype.route = function(re, cb) {
  if (typeof re == 'string') re = new RegExp('^'+re+'$');
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
        // return capture groups as third param
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

exports.app = function(templates) {
  var a = new App();
  a.loadTemplates(templates);
  return a;
};
