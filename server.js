const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const immutable = require('immutable')
const randomColor = require('randomcolor')
var rn = require('random-number');
var options = {
  min:  0,
   max:  5,
 integer: true
}
var options1 = {
  min:0,
  max:300,
  integer: true
}
var options2 = {
  min:0,
  max:800,
  integer: true
}


let port = process.env.PORT || 8080
let ip_addr = process.env.IP_ADDR || '0.0.0.0'

let globalState = immutable.fromJS({
  clients: []
})

server.listen(port, ip_addr)
console.log('Server listening on port', port)



io.on('connection', client => {
  client.on('subscribeToState', interval => {
    /*console.log('client', client.id,'is subscribing to state with interval', interval)*/
    
    let updatedClients = globalState.get('clients').push(immutable.fromJS({ id: client.id, position: { x: rn(options2), y: rn(options1) }, color: randomColor(), score: 0 }))
    globalState = globalState.set('clients', updatedClients)
        
    setInterval(() => { client.emit('state', globalState) }, interval)
    
    //console.log(updatedClients)
    

    
    
  })

  client.on('emitPositionChange', change => {
    /*console.log('client', client.id, 'is EPC', change)*/
     
    let updatedClients = globalState.get('clients').map( c => c.get('id') === client.id ?
      //le agregue que aumentara un poco el score para probar
      immutable.fromJS({ id: client.id, position: change.position, color: c.get('color'), score: c.get('score') + 0.02 }) : c)
   
    globalState = globalState.set('clients', updatedClients) 

    colisionClient()
    //console.log(updatedClients)
    client.emit('state', globalState) 



  })

  client.on('emitColision', toAddScore => {
    let updatedClients = globalState.get('clients').map( c => c.get('id') === client.id ?
      immutable.fromJS({ id: client.id, position: c.get('position'), color: c.get('color'), score: c.get('score') + toAddScore }) : c)

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
  function colisionClient(){
    //console.log('entre colision')
    let  clientID= ''
    let updatedClients = globalState.get('clients')
    //console.log(updatedClients)
    for(let h = 0;h<updatedClients.size;h++){
      //console.log('for1')
      let clientX = updatedClients.get(h)
      for(let g = 0;g<updatedClients.size-1 ;g++){
        if(g == h){
          g++
        }
        //console.log('for2')
        let clientY = updatedClients.get(g)
        //console.log('coordenada',clientX.get('position').get('x'),',',clientX.get('position').get('y'))
        let ejex = Math.pow((clientX.get('position').get('x') - clientY.get('position').get('x')), 2)
       // console.log(ejex)
        let distance = Math.sqrt(Math.pow(clientX.get('position').get('x') - clientY.get('position').get('x'), 2)+Math.pow(clientX.get('position').get('y')-clientY.get('position').get('y'),2))
        //console.log('distancia',distance)
        let colision = distance - clientX.get('score') - clientY.get('score')
       // console.log('colision',colision)
        if(colision <= 0 ){
          if(clientX.get('score')>clientY.get('score')){
            clientID = clientY.get('id')
          }else{
           clientID = clientX.get('id')
          }
          updatedClients = globalState.get('clients').filterNot(client => client.get('id') === clientID) 
          globalState = globalState.set('clients', updatedClients)
          updatedClients = globalState.get('clients').map( c => c.get('id') === client.id ? 
            immutable.fromJS({ id: client.id, position: c.get('position'), color: c.get('color'), score: c.get('score') + 1 }) : c)
          globalState = globalState.set('clients', updatedClients) 
          client.emit('state', globalState)
        }
        
      }
      
     
    }
  }
})


