var through = require('through')

module.exports = dbStream

function dbStream(db) {
  var stream = through(write)

  return stream

  function write(data) {
    db.put(data.id, data)
  }
}
