var through = require('through')

module.exports = namespace

function namespace(name) {
  var stream = through(write)

  return stream

  function write(data) {
    var obj = {}

    obj[name] = data

    stream.queue(obj)
  }
}
