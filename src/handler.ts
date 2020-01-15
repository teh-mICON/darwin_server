import Game from './game/game';
import Creature from './game/creature';

import * as _ from 'lodash'

class Handler {
  private socket;
  private game: Game;
  private creature: Creature;

  constructor(socket, game: Game) {
    this.socket = socket;
    this.game = game;
    this.creature = game.spawn();
    this.creature.setHandler(this);
  }

  public send(event, message = {} as any) {
    message.event = event;
    this.socket.send(JSON.stringify(message))
  }

  init() {
    this.send('init', { id: this.creature.getId(), msg: 'Species initialized, you are now cleared to play' });
  }
  status() {
    this.send('status', { creature: this.creature.export() });
  }
  destroy() {
    this.game.despawn(this.creature);
  }
  getCreature() { return this.creature; }

  die(age) {
    this.send('die', { age })
    this.destroy();
    this.socket.close();
  }


  // ----
  incoming(msg) {
    const method = this['_' + msg.event]
    if (method === undefined) throw new Error('Unknown action: ' + msg.event)

    method.apply(this, [msg]);
  }

  _init(msg) {
    this.creature.setSpeciesId(msg.speciesId);
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

    if (this.game.getWorld().isEmpty(x, y)) {
      creature.moveTo(x, y)
      this.send('move', { x, y })
    } else {
      creature.pain(.1);
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
    const tiles = this.game.getWorld().getTilesByRange(vicinity.minX, vicinity.minY, vicinity.maxX, vicinity.maxY);
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
    const tiles = this.game.getWorld().getTilesByRange(vicinity.minX, vicinity.minY, vicinity.maxX, vicinity.maxY);
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
    const visibleTiles = this.game.getWorld().getTilesByRange(visibleRange.minX, visibleRange.minY, visibleRange.maxX, visibleRange.maxY);
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

export default Handler;