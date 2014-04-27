var event_stream = require('dom-event-stream')
  , value_stream = require('dom-value-stream')
  , dotpath_stream = require('dotpath-stream')
  , leveldown = require('localstorage-down')
  , through = require('through')
  , levelup = require('levelup')
  , altr = require('altr')
  , uuid = require('uuid')

var db = levelup('/lol', {db: setup_local_storage, valueEncoding: 'json'})

var todo_stream = require('./lib/todo')()

var items_el = document.querySelector('[rel=items-container]')
  , items_template = altr(items_el)

var new_item_el = document.querySelector('[rel=new-item]')
  , new_item_template = altr(new_item_el)

new_item_template.stream = through(function(data) {
  new_item_template.update({text: data})
})

items_template.stream = through(function(data) {
  items_template.update({items: data})
})

var input_el = document.querySelector('[name=todo-entry]')

var decode_stream = dotpath_stream('value')
  , add_stream = through(add_item, noop)

var key_stream = event_stream(input_el, 'keyup')

input_el.focus()

key_stream.on('data', check_key)

db.createReadStream().pipe(decode_stream).pipe(add_stream)

key_stream
  .pipe(value_stream())
  .pipe(new_item_template.stream)

todo_stream.pipe(items_template.stream)

new_item_template.update({text: ''})
items_template.update({items: []})
items_el.addEventListener('click', check_button, false)

function add_item(data) {
  todo_stream.add(data)
}

function check_key(ev) {
  var key = ev.which || ev.charCode || ev.keyCode

  if(key !== 13 || !input_el.value.length) return

  var data = {
      id: uuid.v4()
    , text: input_el.value
    , status: 'incomplete'
  }

  db.put(data.id, data)
  add_stream.write(data)

  input_el.value = ''
}

function check_button(ev) {
  ev.preventDefault()

  var el = ev.target
  var rel = el.getAttribute('rel')

  if(!rel) return

  if(rel === 'remove') return remove_item()
  if(rel === 'toggle') return toggle_status()

  function remove_item() {
    var id = el.parentNode.getAttribute('data-id')

    db.del(id)
    todo_stream.remove(id)
  }

  function toggle_status() {
    var item = todo_stream.get(el.parentNode.getAttribute('data-id'))
    item.status = item.status === 'complete' ? 'incomplete' : 'complete'

    db.put(item.id, item)
    todo_stream.update(item)
  }
}

function setup_local_storage(location) {
  return new leveldown(location)
}

function noop() {}
