var events = require('dom-delegation-stream')
  , Leveldown = require('localstorage-down')
  , values = require('dom-value-stream')
  , dotpath = require('dotpath-stream')
  , objectstate = require('objectstate')
  , through = require('through')
  , levelup = require('levelup')
  , uuid = require('uuid')

var namespace = require('./lib/namespace-stream')
  , dbStream = require('./lib/db-stream.js')
  , altr = require('./lib/altr-stream')
  , todo = require('./lib/todo')

var db = levelup('/lol', {db: setupLocalStorage, valueEncoding: 'json'})
  , state = objectstate()
  , todoStream = todo()

var decodeStream = dotpath('value')

var itemsEl = document.querySelector('[rel=items-container]')
  , itemsTemplate = altr(itemsEl)

var newItemEl = document.querySelector('[rel=new-item]')
  , newItemTemplate = altr(newItemEl)

var inputEl = document.querySelector('[name=todo-entry]')
  , keyStream = events(inputEl, 'keyup')

var newItems = keyStream.pipe(gateStream())

newItems.pipe(dbStream(db))
newItems.pipe(through(todoStream.add.bind(todoStream)))

newItems.on('data', clearInputs)

events(itemsEl, 'click', '[rel=remove]').on('data', removeItem)
events(itemsEl, 'click', '[rel=toggle]').on('data', toggleStatus)

clearInputs()
inputEl.focus()
itemsTemplate.write({items: []})

state.listen(keyStream.pipe(values()), 'text')

state.pipe(newItemTemplate)

todoStream.pipe(namespace('items')).pipe(itemsTemplate)

db.createReadStream()
  .pipe(decodeStream)
  .pipe(through(todoStream.add.bind(todoStream)))

function clearInputs() {
  inputEl.value = ''
  state.set('text', '')
}

function gateStream() {
  var stream = through(write)

  return stream

  function write(ev) {
    var key = ev.which || ev.charCode || ev.keyCode
      , text = state.get('text')

    if(key !== 13 || !text.length) return

    var data = {
        id: uuid.v4()
      , text: text
      , status: 'incomplete'
    }

    stream.queue(data)
  }
}

function removeItem(ev) {
  var id = ev.target.parentNode.getAttribute('data-id')

  db.del(id)
  todoStream.remove(id)
}

function toggleStatus(ev) {
  var item = todoStream.get(ev.target.parentNode.getAttribute('data-id'))

  item.status = item.status === 'complete' ? 'incomplete' : 'complete'

  db.put(item.id, item)
  todoStream.update(item)
}

function setupLocalStorage(location) {
  return new Leveldown(location)
}
