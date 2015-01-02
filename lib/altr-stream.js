var through = require('through')
  , altr = require('altr')

module.exports = altrStream

function altrStream(el) {
  var stream = through(write)

  var view = altr(el)

  return stream

  function write(data) {
    view.update(data)
  }
}
