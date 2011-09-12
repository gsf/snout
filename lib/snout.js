// snout -- a lightweight app framework for Node

var fs = require('fs');
var http = require('http');
var path = require('path');
var url = require('url');
var util = require('util');

var App = function() {
  this.templates = {};
  this.routes = [];
};

// pack up a directory's files and data for quick access
var pack = function(dir) {
  var packed = {};
  var extRe = /\.[^.]+$/;
  // p is file path, curDir is current directory
  var packr = function(p, curDir) {
    //console.log(p);
    var files;
    var base = path.basename(p);
    var noExt = base.replace(extRe, '');
    if (fs.statSync(p).isDirectory()) {
      // keep original directory at root level
      if (p != dir) {
        curDir = curDir[base] = {};
      }
      files = fs.readdirSync(p);
      //console.log(' '+util.inspect(files));
      for (var i=0; i<files.length; i++) {
        packr(p+'/'+files[i], curDir);
      }
    } else {
      curDir[noExt] = curDir[base] = fs.readFileSync(p, 'utf8');
    }
  };
  packr(dir, packed);
  return packed;
};

// make templates available at app.templates
App.prototype.loadTemplates = function(templateDir) {
  this.templates = pack(templateDir);
  //console.log(util.inspect(this.templates));
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

exports.app = function(appDir) {
  var a = new App();
  a.loadTemplates(appDir+'/templates');
  return a;
};
