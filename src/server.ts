import Game from './game/game';
import * as express from 'express'
import * as path from 'path'
import * as _ from 'lodash'
import Handler from './handler';

const game = new Game();
const world = game.getWorld();



// UI
/*app.get('/', (request, response) => {
  response.sendFile(path.join(__dirname + '/../public/index.html'));
});
app.get('/world', (request, response) => {
  _.map(world.getTiles(0, 0, 1000, 1000), tile => {
    if(tile.getType() == 'creature') {
      console.log(tile)
    }
  });
  response.send(world.export())
});*/

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3000 });

wss.on('connection', (socket)  => {
  console.log('CONNECTED')
  let handler = new Handler(socket, game);
  console.log('HANDLER CREATED')

  // send init after 1s
  setTimeout(() => {
    console.log('SENDING INIT')
    handler.init(game)
  }, 1000)
  console.log('TIMEOUT CREATED')

  // forward messages to handler
  socket.on('message', msg => {
    console.log('INC RAW', msg)
    try {
      handler.incoming(JSON.parse(msg), game);
    } catch(error) {
      console.error(error)
      socket.send(JSON.stringify({event: 'error', message: error.message}))
    }
  });

  socket.on('close', () => {
    handler.destroy(game)
    handler = undefined;
  })
});

console.log('Server listening')