var event_stream = require('dom-event-stream')
  , value_stream = require('dom-value-stream')
  , through = require('through')
  , altr = require('altr')

var id = 0

var attribute_lookup = require('./lib/attribute-lookup')
  , todo_stream = require('./lib/todo')()

var items_el = document.querySelector('[rel=items-container]')
  , items_template = altr(items_el)

var new_item_el = document.querySelector('[rel=new-item]')
  , new_item_template = altr(new_item_el)

var input_el = document.querySelector('[name=todo-entry]')

var new_item_stream = through(write_new_item)
  , items_stream = through(write_items)

var key_stream = event_stream(input_el, 'keyup')

key_stream.on('data', check_key)

key_stream
  .pipe(value_stream())
  .pipe(new_item_stream)

todo_stream.pipe(items_stream)

new_item_template.update({text: ''})
items_template.update({items: []})
items_el.addEventListener('click', check_button, false)

function write_new_item(data) {
  new_item_template.update({text: data})
}

function write_items(data) {
  console.log({items: data})
  items_template.update({items: data})
}

function check_key(ev) {
  var key = ev.key || ev.which || ev.keyCode

  if (key !== 13) return
  todo_stream.add({id: ++id, text: input_el.value, status: 'incomplete'})
  input_el.value = ''
}

function check_button(ev) {
  ev.preventDefault()

  var el = ev.target
  var rel = attribute_lookup(el, 'rel')

  if (!rel) return

  ({
      'remove': remove_item
    , 'toggle': toggle_status
  }[rel] || noop)()

  function remove_item() {
    todo_stream.remove(attribute_lookup(el.parentNode, 'data-id'))
  }

  function toggle_status() {
    var item = todo_stream.get(attribute_lookup(el.parentNode, 'data-id'))
    item.status = item.status === 'complete' ? 'incomplete' : 'complete'

    todo_stream.update(item)
  }
}

function noop() {}
