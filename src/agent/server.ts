import Simulation from '../simulation/simulation';
import Creature from '../simulation/creature';
import * as WebSocket from 'ws'
import * as _ from 'lodash'

declare var PORTS;

/**
 * An Agent is a puppet master of a creature. In most cases it will be some kind of AI,
 * but can be human as well.
 * This server takes websocket messages from such an agent and controls the creature
 * inside the simulation based on them
 */
export default class AgentServer {

  private simulation: Simulation;
  private handlers = [];
  private ports;

  constructor(simulation, ports) {
    this.simulation = simulation;
    this.ports = ports;
  }

  listen() {
    // create new websocket
    const wss = new WebSocket.Server({ port: this.ports.agent });
    wss.on('connection', (socket) => {
      // on connect, create handler for messages
      let handler;
      try {
        handler = new Handler(socket, this.simulation);
      } catch (error) {
        console.log('Handler creation error', error)
        socket.close();
        return;
      }
      // add handler to handlers array
      this.handlers.push(handler)
    
      // send init after 100ms
      setTimeout(() => {
        handler.init()
      }, 100)
    
      // forward messages to handler
      socket.on('message', (message: string) => {
        try {
          handler.incoming(JSON.parse(message));
        } catch (error) {
          console.error(error)
          socket.send(JSON.stringify({ event: 'error', message: error.message }))
        }
      });
      // on close, destroy the handler and remove it from handlers array
      socket.on('close', () => {
        handler.destroy()
        _.remove(this.handlers, candidate => candidate.getCreature().getID() == handler.getCreature().getID())
      })
    });

    console.log('AgentServer listening on', this.ports.agent)
  }
}

export class Handler {
  private socket;
  private simulation: Simulation;
  private creature: Creature;

  constructor(socket, simulation: Simulation) {
    this.socket = socket;
    this.simulation = simulation;
    this.creature = simulation.spawn();
    this.creature.setHandler(this);
  }

  public send(event, message = {} as any) {
    message.event = event;
    this.socket.send(JSON.stringify(message))
  }

  init() {
    this.send('init', { id: this.creature.getID(), msg: 'Creature initialized, you are now cleared to play' });
  }
  status() {
    this.send('status', { creature: this.creature.export() });
  }
  destroy() {
    this.simulation.despawn(this.creature);
  }
  getCreature() { return this.creature; }

  die(age) {
    this.send('die', { age })
    this.socket.close();
  }


  // ----
  incoming(msg) {
    const method = this['_' + msg.event]
    if (method === undefined) throw new Error('Unknown action: ' + msg.event)

    method.apply(this, [msg]);
  }

  _init(msg) {
    this.creature.setSpeciesID(msg.speciesID);
  }

  _status(msg) {
    // client has sent status message, mark this one to be sent a status on next tick
    this.creature.setStatusOnTick(true)
  }

  _move(msg) {
    const creature: Creature = this.creature;
    let x, y;
    switch (this.creature.getFacing()) {
      case 'up':
        x = creature.getX();
        y = creature.getY() - 1;
        break;
      case 'right':
        x = creature.getX() + 1;
        y = creature.getY();
        break;
      case 'down':
        x = creature.getX();
        y = creature.getY() + 1;
        break;
      case 'left':
        x = creature.getX() - 1;
        y = creature.getY();
        break;
    }

    if (this.simulation.getWorld().isEmpty(x, y)) {
      creature.moveTo(x, y)
      this.send('move', { x, y })
    } else {
      // creature.pain(.1);
    }
  }

  _turn(msg) {
    const rotation = ['up', 'right', 'down', 'left'];
    const closest = (current, direction) => {
      const last = rotation.length - 1;
      const first = 0;
      const index = rotation.indexOf(current);

      if (direction == 'right') {
        return index != last
          ? rotation[index + 1]
          : rotation[first];
      }
      return index == first
        ? rotation[last]
        : rotation[index - 1];
    }
    const newDirection = closest(this.creature.getFacing(), msg.direction);
    this.creature.turn(newDirection)
  }

  _eat(msg) {
    // check for tree in immediate vicinity
    const vicinity = this.creature.getVicinity();
    const tiles = this.simulation.getWorld().getTilesByRange(vicinity.minX, vicinity.minY, vicinity.maxX, vicinity.maxY);
    const treeTiles = _.filter(tiles, tile => tile.getType() == 'tree');
    if (!treeTiles.length) {
      this.creature.pain(.1);
      return;
    }

    const food = treeTiles[0].getTree().harvest();
    this.creature.eat(food);
    //console.log('MOFO ATE', food, this.creature.getFood())
  }

  _drink(msg) {
    // check for tree in immediate vicinity
    const vicinity = this.creature.getVicinity();
    const tiles = this.simulation.getWorld().getTilesByRange(vicinity.minX, vicinity.minY, vicinity.maxX, vicinity.maxY);
    const waterTiles = _.filter(tiles, tile => tile.getType() == 'water');
    if (!waterTiles.length) {
      this.creature.pain(.1);
      return;
    }
    //console.log('MOFO DRANK', this.creature.getWater())
    this.creature.drink(1);
  }

  _attack(msg) {
    // check for creatures in visible range
    const visibleRange = this.creature.getVisibleRange();
    const visibleTiles = this.simulation.getWorld().getTilesByRange(visibleRange.minX, visibleRange.minY, visibleRange.maxX, visibleRange.maxY);
    const creatureTiles = _.filter(visibleTiles, tile => tile.getType() == 'creature');
    if (!creatureTiles.length) {
      this.creature.pain(.1);
      return;
    }

    _.each(creatureTiles, creatureTile => {
      this.creature.feed(creatureTile.getCreature());
      //console.log('MOFO ATTACKED');
    });
  }
}