const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const immutable = require('immutable')
let port = process.env.PORT || 8080

let globalState = immutable.fromJS({
  clients: [{
    id: 'Luisa',
    position: {
      x: 0,
      y: 0
    }
  },{
    id: 'Chan',
    position: {
      x: 100,
      y: 100
    }
  }]
})

server.listen(port)
console.log('Server listening on port', port)

io.on('connection', (client) => {
  client.on('subscribeToState', (interval) => {
    console.log('client', client.id,'is subscribing to state with interval', interval)
    
    let updatedClients = globalState.get('clients').push(immutable.fromJS({ id: client.id, position: { x: 100, y: 100 } }))
    globalState = globalState.set('clients', updatedClients)
        
    setInterval(() => { client.emit('state', globalState) }, interval)
  })
})

