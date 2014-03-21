var through = require('through')

module.exports = todo

function todo(_items, _lookup) {
  var todo_stream = through()

  var lookup = _lookup || default_lookup
    , items = _items || []

  todo_stream.add = add
  todo_stream.remove = remove
  todo_stream.update = update
  todo_stream.get = get

  return todo_stream

  function get(_id) {
    var id = +_id

    for (var i = 0, l = items.length; i < l; ++i) {
      if (lookup(items[i]) === id) return items[i]
    }
  }

  function add(item) {
    items.unshift(item)

    todo_stream.queue(items)
  }

  function remove(_id) {
    var id = +_id

    items = items.filter(remove_id)

    todo_stream.queue(items)

    function remove_id(item) {
      return lookup(item) !== id
    }
  }

  function update(item) {
    for (var i = 0, l = items.length; i < l; ++i) {
      if (lookup(items[i]) === lookup(item)) {
        items[i] = item
        return todo_stream.queue(items)
      }
    }
  }
}

function default_lookup(item) {
  return item.id
}
