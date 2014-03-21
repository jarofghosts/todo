module.exports = lookup

function lookup(element, name) {
  var attrs = [].slice.call(element.attributes)

  for (var i = 0, l = attrs.length; i < l; ++i) {
    if (attrs[i].name === name) return attrs[i].value
  }

  return
}
