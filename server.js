const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

let port = process.env.PORT || 8080

server.listen(port)
console.log('Server listening on port', port)

io.on('connection', (client) => {
  client.on('subscribeToTimer', (interval) => {
    console.log('client is subscribing to timer with interval ', interval)
    setInterval(() => {
      client.emit('timer', new Date())
    }, interval)
  })
})

