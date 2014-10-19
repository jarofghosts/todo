var eventStream = require('dom-event-stream')
  , valueStream = require('dom-value-stream')
  , dotpathStream = require('dotpath-stream')
  , Leveldown = require('localstorage-down')
  , through = require('through')
  , levelup = require('levelup')
  , altr = require('altr')
  , uuid = require('uuid')

var db = levelup('/lol', {db: setupLocalStorage, valueEncoding: 'json'})

var todo = require('./lib/todo')

var itemsEl = document.querySelector('[rel=items-container]')
  , itemsTemplate = altr(itemsEl)

var newItemEl = document.querySelector('[rel=new-item]')
  , newItemTemplate = altr(newItemEl)

newItemTemplate.stream = through(function(data) {
  newItemTemplate.update({text: data})
})

var todoStream = todo()

itemsTemplate.stream = through(function(data) {
  itemsTemplate.update({items: data})
})

var inputEl = document.querySelector('[name=todo-entry]')

var addStream = through(addItem, Function())
  , decodeStream = dotpathStream('value')

var keyStream = eventStream(inputEl, 'keyup')

inputEl.focus()

keyStream.on('data', checkKey)

db.createReadStream().pipe(decodeStream).pipe(addStream)

keyStream
  .pipe(valueStream())
  .pipe(newItemTemplate.stream)

todoStream.pipe(itemsTemplate.stream)

newItemTemplate.update({text: ''})
itemsTemplate.update({items: []})
itemsEl.addEventListener('click', checkButton, false)

function addItem(data) {
  todoStream.add(data)
}

function checkKey(ev) {
  var key = ev.which || ev.charCode || ev.keyCode

  if(key !== 13 || !inputEl.value.length) return

  var data = {
      id: uuid.v4()
    , text: inputEl.value
    , status: 'incomplete'
  }

  db.put(data.id, data)
  addStream.write(data)

  inputEl.value = ''
}

function checkButton(ev) {
  ev.preventDefault()

  var el = ev.target
  var rel = el.getAttribute('rel')

  if(!rel) return

  if(rel === 'remove') return removeItem()
  if(rel === 'toggle') return toggleStatus()

  function removeItem() {
    var id = el.parentNode.getAttribute('data-id')

    db.del(id)
    todoStream.remove(id)
  }

  function toggleStatus() {
    var item = todoStream.get(el.parentNode.getAttribute('data-id'))

    item.status = item.status === 'complete' ? 'incomplete' : 'complete'

    db.put(item.id, item)
    todoStream.update(item)
  }
}

function setupLocalStorage(location) {
  return new Leveldown(location)
}
