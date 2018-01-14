const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const immutable = require('immutable')
const randomColor = require('randomcolor')
let port = process.env.PORT || 8080

let globalState = immutable.fromJS({
  clients: []
})

server.listen(port)
console.log('Server listening on port', port)

io.on('connection', client => {
  client.on('subscribeToState', interval => {
    /*console.log('client', client.id,'is subscribing to state with interval', interval)*/
    
    let updatedClients = globalState.get('clients').push(immutable.fromJS({ id: client.id, position: { x: 0, y: 0 }, color: randomColor() }))
    globalState = globalState.set('clients', updatedClients)
        
    setInterval(() => { client.emit('state', globalState) }, interval)
  })

  client.on('emitPositionChange', change => {
    /*console.log('client', client.id, 'is EPC', change)*/

    let updatedClients = globalState.get('clients').map( c => c.get('id') === client.id ? immutable.fromJS({ id: client.id, position: change.position }) : c )
    globalState = globalState.set('clients', updatedClients) 

    client.emit('state', globalState)  
  })

  client.on('disconnect', () => {
    /*console.log('client', client.id,'is disconnected')*/
    let deleteClient = client.id
    let updatedClients = globalState.get('clients').filterNot(client => client.get('id') === deleteClient)
    globalState = globalState.set('clients', updatedClients)

    client.emit('state', globalState)
  })
})

