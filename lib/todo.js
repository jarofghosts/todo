var through = require('through')

module.exports = todo

function todo(_items, _lookup) {
  var todoStream = through()

  var lookup = _lookup || defaultLookup
    , items = _items || []

  todoStream.add = add
  todoStream.remove = remove
  todoStream.update = update
  todoStream.get = get

  return todoStream

  function get(id) {
    for(var i = 0, l = items.length; i < l; ++i) {
      if(lookup(items[i]) === id) return items[i]
    }
  }

  function add(item) {
    items.unshift(item)

    todoStream.queue(items)
  }

  function remove(id) {
    items = items.filter(removeId)

    todoStream.queue(items)

    function removeId(item) {
      return lookup(item) !== id
    }
  }

  function update(item) {
    for(var i = 0, l = items.length; i < l; ++i) {
      if(lookup(items[i]) === lookup(item)) {
        items[i] = item

        return todoStream.queue(items)
      }
    }
  }
}

function defaultLookup(item) {
  return item.id
}
