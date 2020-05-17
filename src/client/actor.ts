import _ from 'lodash'
import WebSocket from 'ws'
import Network from '../../../sonic/src/network';

export default class Actor {

  private speciesID;
  private agentPort;
  private id;
  private alive = false;

  private age = 0;
  private maxAge = 0;
  private state = {
    food: 10,
    water: 10,
    energy: 1000,
    facing: 'up',
    vision: {
      mountain: [],
      water: [],
      tree: [],
      hive: [],
      creature: []
    }
  }
  private deathCallback;
  private network: Network;
  private connection: Connection;

  constructor(speciesId, agentPort, network, deathCallback) {
    this.speciesID = speciesId;
    this.agentPort = agentPort;
    this.network = Network.import(network)
    this.addCallbacks();
    this.deathCallback = deathCallback;
    this.connection = new Connection(this);
  }
  goes() {
    this.connection.open(this.agentPort);
  }
  destroy() {
   try {
     this.connection.close();
     
  } catch (error) {
    
  } 
    this.network.destroy();
  }

  handle(msg) {
    const method = this['_' + msg.event]
    if (method === undefined) {
      throw new Error('Unknown action: ' + msg.event)
    }
    method.apply(this, [msg]);
  }

  addCallbacks() {
    this.network.setOutputCallback(0, () => {
      this.send('move')
      // console.log('MOVE')
    });
    this.network.setOutputCallback(1, () => {
      this.send('turn', { direction: 'left' })
      // console.log('T LEFT')
    });
    this.network.setOutputCallback(2, () => {
      this.send('turn', { direction: 'right' })
      // console.log('T RIGHT')
    });
    this.network.setOutputCallback(3, () => {
      this.send('eat')
      // console.log('EAT')
    });
    this.network.setOutputCallback(4, () => {
      this.send('drink')
      // console.log('DRINK')
    });
    this.network.setOutputCallback(5, () => {
      this.send('attack')
      // console.log('ATTACK')
    });
  }

  _init(msg) {
    // on init message from server, send species ID and first status message
    this.send('init', { speciesID: this.speciesID })
    this.send('status')
    // id created by server creature
    this.id = msg.id;
  }

  _error(msg) {
    console.log('ERROR EVENT')
    console.error(msg)
  }
  _die(msg) {
    this.connection.close();
    if (msg.age > this.maxAge) this.maxAge = msg.age;
    this.deathCallback(this, msg)
    this.connection.open(this.agentPort);
  }

  // 0        : motivation
  // 1 - 15   : mountain
  // 16 - 30  : water
  // 31 - 45  : tree
  // 46 - 60  : hive
  // 61 - 75  : creature
  // 76 - 78  : pain + hunger + thirst
  // 79 - 81  : drink + eat + feed
  // 82 - 84  : food + water + energy
  _pain(msg) {
    this.network.activate(76, msg.intensity)
  }
  _hunger(msg) {
    this.network.activate(77, msg.intensity)
  }
  _thirst(msg) {
    this.network.activate(78, msg.intensity)
  }
  _drink(msg) {
    this.network.activate(79, msg.water)
  }
  _eat(msg) {
    this.network.activate(80, msg.intensity)
  }
  _feed(msg) {
    this.network.activate(81, msg.food)
  }
  _status(msg) {
    this.age = msg.creature.age

    // add basic properties
    this.state.food = msg.creature.food;
    this.state.water = msg.creature.water;
    this.state.energy = msg.creature.energy;


    // collect tile inputs
    const types = { 'mountain': 1, 'water': 16, 'tree': 31, 'hive': 46, 'creature': 61 };
    const result = { 1: 1 }
    _.each(_.range(0, 14), index => {
      _.each(types, (offset, type) => {
        if (msg.creature.vision[index] === null) {
          return;
        }

        const tile = msg.creature.vision[index];
        if (tile.type == type) {
          result[offset + index] = 1;
        }
      });
    });
    this.network.activateMultiple(result)
    this.send('status')
  }
  _turn(msg) {
  }
  _move(msg) {
  }
  send(event, msg = {} as any) {
    msg.event = event;
    this.connection.send(msg);
  }

  isAlive() { return this.alive; }
  setAlive(alive) { this.alive = alive; }
  getAge() { return this.age; }
  getMaxAge() { return this.maxAge; }
  getID() { return this.id; }
  getNetwork() { return this.network.export() }
}

class Connection {

  private actor: Actor;
  private ws: WebSocket;
  private queue = [];
  private interval;

  constructor(actor: Actor) {
    this.actor = actor;
  }
  open(port) {
    this.ws = new WebSocket('ws://localhost:' + port);
    this.ws.onerror = (event) => {
    }

    this.ws.onopen = event => {
      this.ws.addEventListener('message', msgJSON => {
        const msg = JSON.parse(msgJSON.data);
        this.actor.handle(msg);
      });

      this.interval = setInterval(() => {
        if (!this.queue.length) return;
        if (this.ws.readyState != 1) return;
        const msg = this.queue.shift();
        this.ws.send(JSON.stringify(msg));
      }, 5);
    };

    this.ws.onclose = event => {
      clearInterval(this.interval);
    }
  }
  close() {
    this.ws.close();
  }

  send(msg) {
    this.queue.push(msg)
  }
}