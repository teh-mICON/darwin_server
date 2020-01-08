import Game from './game/game';
import Species from './game/species';
import Creature from './game/creature';

import * as _ from 'lodash'

class Handler {
  private socket;
  private speciesId: string;

  constructor(socket, game: Game) {
    this.socket = socket;
    this.speciesId = game.registerSpecies();
  }

  private send(event, message = {} as any) {
    message.event = event;
    console.log('SENDING', message, JSON.stringify(message))
    this.socket.send(JSON.stringify(message))
  }


  destroy(game: Game) {
    game.unregisterSpecies(this.speciesId);
  }
  private species(game: Game): Species {
    return game.getSpecies(this.speciesId);
  }
  // ----

  init(game: Game) {
    this.send('init', { msg: 'Species initialized, you are now cleared to play: ' + this.species(game).getId() });
  }

  incoming(msg, game) {
    return;
    const method = this['_' + msg.event]
    if (method === undefined) throw new Error('Unknown action: ' + msg.event)

    method.apply(this, [msg, game]);
  }

  _init(msg) {
    console.log('Client ready:', this.speciesId)
  }

  _spawn(msg, game) {
    const species = game.getSpecies(this.speciesId)
    const creature = this.species(game).spawnCreature();
    this.send('spawn', { id: creature.getId() })
  }

  _move(msg, game) {
    const creature: Creature = this.species(game).getCreature(msg.creature)
    let x, y;
    switch (msg.direction) {
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

    if (game.getWorld().isEmpty(x, y)) {
      creature.moveTo(x, y)
      this.send('move', { id: creature.getId(), x, y })
    } else {
      this.send('pain', { id: creature.getId(), direction: msg.direction, intensity: 1 })
    }
  }

  _turn(msg, game) {
    const creature: Creature = this.species(game).getCreature(msg.creature)
    creature.turn(msg.direction)
    this.send('turn', { id: creature.getId(), direction: msg.direction })

  }

  _status(msg, game) {
    const creature: Creature = this.species(game).getCreature(msg.creature)
    const visible = creature.getVisibleRange();
    const tiles = game.getWorld().getTiles(visible.minX, visible.minY, visible.maxX, visible.maxY);
    this.send('status', { id: creature.getId(), tiles: _.map(tiles, tile => tile.export()) })
  }
}

export default Handler;