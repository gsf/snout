// snout -- a lightweight app framework for Node

var fs = require('fs');
var http = require('http');
var path = require('path');
var url = require('url');
var util = require('util');

var App = function() {
  this.models = {};
  this.templates = {};
  this.routes = [];
};

// walk a directory's files and optionally store data for quick access. 
// returns an object where each subdirectory is an object and each file
// is a string (empty unless options.contents is truthy).
var walk = function(dir, options) {
  options = options || {};
  var walked = {};
  var extRe = /\.[^.]+$/;
  // p is file path, curDir is current directory
  var walkr = function(p, curDir) {
    //console.log(p);
    if (!path.existsSync(p)) return;
    var files, data;
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
        walkr(p+'/'+files[i], curDir);
      }
    } else {
      data = options.contents ? fs.readFileSync(p, 'utf8') : '';
      curDir[noExt] = curDir[base] = data;
      // watch file and reload if changed
      fs.watchFile(p, function(curr, prev) {
        console.log('the current mtime is: ' + curr.mtime);
        console.log('the previous mtime was: ' + prev.mtime);
        if (curr.mtime != prev.mtime) {
          fs.readFile(p, 'utf8', function(err, data) {
            if (err) {
              // do nothing on file not found
              if (err.code == 'ENOENT') {
                return;
              }
              throw err;
            }
            curDir[noExt] = curDir[base] = data;
          });
        }
      });
    }
  };
  walkr(dir, walked);
  return walked;
};

// make models available at app.models
App.prototype.loadModels = function(modelDir) {
  this.models = walk(modelDir, {contents: true});
  //console.log(util.inspect(this.models));
};

// make templates available at app.templates
App.prototype.loadTemplates = function(templateDir) {
  this.templates = walk(templateDir, {contents: true});
  //console.log(util.inspect(this.templates));
};

// each route maps a callback to a regular expression
App.prototype.route = function(re, cb) {
  if (typeof re == 'string') re = new RegExp('^'+re+'$');
  this.routes.push({re: re, cb: cb});
};

App.prototype.respond = function(req, res) {
  var path = url.parse(req.url).pathname;
  var route, ret404 = true;
  for (var i=0, l=this.routes.length; i<l; i++) {
    route = this.routes[i];
    if (route.re.test(path)) {
      ret404 = false;
      // return capture groups as third param
      route.cb(req, res, route.re.exec(path));
      break;
    }
  }
  if (ret404) {
    this.NotFound(res);
  }
};

App.prototype.page404 = '<!doctype html><html><head><title>404</title></head><body><p>Not Found</p></body></html>';

App.prototype.NotFound = function(res) {
  res.writeHead(404, {'Content-Type': 'text/html'});
  res.end(this.page404);
};

exports.app = function(appDir) {
  var a = new App();
  a.loadTemplates(appDir+'/templates');
  a.loadModels(appDir+'/models');
  return a;
};
