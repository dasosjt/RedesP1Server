const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const immutable = require('immutable')
const rc = require('randomcolor')
const port = process.env.PORT || 8080

const randomNumber = (min, max) => Math.floor((Math.random() * max) + min)
const euclideanDistance = (p1, p2) => Math.sqrt(Math.pow(p1.get('x') - p2.get('x'), 2) + Math.pow(p1.get('y') - p2.get('y'), 2))

let global_state = immutable.fromJS({
  clients: [],
  foods : []
})

io.on('connection', (client) => {
  client.on('subscribeToState', interval => {

    for(let i = 0; i < 10; i++){
      global_state = global_state.update('foods', foods => foods.push(immutable.fromJS({ position: { x: randomNumber(0, 800), y: randomNumber(0, 300) }, color: rc(), score: 10 })))
    }

    global_state = global_state.update('clients', clients => {
      return clients.push(immutable.fromJS({ id: client.id, position: { x: 0, y: 0 }, color: rc(), score: 10}))
    })
    
    setInterval(() => { client.emit('state', global_state) }, interval)
  })

  client.on('emitPositionChange', change => {
    let current_client = null
    let current_client_score = 0
    
    global_state = global_state.update('clients', clients => {
      return clients.map( c => {
        if (c.get('id') === client.id){ 
          current_client = immutable.fromJS({ id: client.id, position: change.position, color: c.get('color'), score: c.get('score') })
          return current_client
        }
        return c  
      })
    })

    global_state = global_state.update('clients', clients => {
      return clients.filterNot(c => {
        if(c.get('id') !== client.id && euclideanDistance(current_client.get('position'), c.get('position')) < 10 && current_client.get('score') > c.get('score')){
          current_client_score += c.get('score')
          return true
        }
        return false
      })
    })

    global_state = global_state.update('foods', foods => {
      return foods.filterNot(f => {
        if(euclideanDistance(current_client.get('position'), f.get('position')) < 10){
          current_client_score += f.get('score')
          return true
        }
        return false
      })
    })

    global_state = global_state.update('clients', clients => {
      return clients.map( c => {
        if (c.get('id') === client.id){ 
          current_client = immutable.fromJS({ id: c.get('id'), position: c.get('position'), color: c.get('color'), score: c.get('score') + current_client_score})
          return current_client
        }
        return c  
      })
    })

  })

  client.on('disconnect', () => {
    global_state = global_state.update('clients', clients => {
      return clients.filterNot(c => c.get('id') === client.id)
    })
  })
})

server.listen(port)
console.log('Server listening on port', port)