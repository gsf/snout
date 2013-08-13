// snout sniffs out a directory

var fs = require('fs')
var path = require('path')

module.exports = function snout (dir) {
  var sniffed = {}
  function sniff (subdir) {
    fs.readdirSync(path.join(dir, subdir)).forEach(function (file) {
      file = path.join(subdir, file)
      var p = path.join(dir, file) // p is the full path
      if (fs.statSync(p).isDirectory()) {
        sniff(file)
      } else {
        sniffed[file] = fs.readFileSync(p, 'utf8')
      }
    })
  }
  sniff('')
  return sniffed
}
