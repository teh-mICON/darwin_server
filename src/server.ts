import * as _ from 'lodash'
import * as overwrite from 'terminal-overwrite';
import * as  uuid from 'uuid/v4'


import * as http from 'http';

import Game from './game/game';
import Handler from './handler';
import DatabaseAPI from './database'
import Controller from './controller'

const game = new Game(200, 200);
let handlers = [];

// db server
const db = new DatabaseAPI();
db.listen(8081);
console.log('db api server listening on 8081')

// UI
http.createServer(async (request, response) => {
  const controller = new Controller(request, response, game);
  controller.handleRequest();
}).listen(8082);
console.log('UI data server listening on 8082')

// game logic
const tickRate = 100;
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });
wss.on('connection', (socket) => {
  let handler;
  try {
    handler = new Handler(socket, game);
  } catch (error) {
    socket.close();
    return;
  }
  handlers.push(handler)

  // send init after 1s
  setTimeout(() => {
    handler.init()
  }, 1000)

  // forward messages to handler
  socket.on('message', msg => {
    try {
      handler.incoming(JSON.parse(msg));
    } catch (error) {
      console.error(error)
      socket.send(JSON.stringify({ event: 'error', message: error.message }))
    }
  });

  socket.on('close', () => {
    handler.destroy()
    handlers = _.filter(handlers, candidate => candidate.getCreature().getId() != handler.getCreature().getId());
  })
});

let tick = 0;
const loop = () => {
  game.tick();

  //overwrite('# of active creatures: ' + Object.keys(game.getCreatures()).length)
  if((tick++ % 1000) == 0) {
    console.log('tick #', tick + '; creatures alive atm:', Object.keys(game.getCreatures()).length)
  }

  setTimeout(loop, 1000 / tickRate);
};
loop();

console.log('game server listening on 3000; Tick rate:', tickRate)