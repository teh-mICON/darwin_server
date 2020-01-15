import * as _ from 'lodash'
import { uuid } from 'uuidv4'
import World from "./world";
import Hive from "./hive";
import Creature from './creature';

class Game {
  private world: World;
  private creatures = {} as any;
  constructor(width, height) {
    this.world = new World(this, width, height)
  }

  getWorld() { return this.world; }
  getCreatures() { return this.creatures; }

  tick() {
    // age creatures
    _.each(this.creatures, (creature: Creature) => {
      creature.tick();
      if(creature.getEnergy() <= 0) {
        creature.die();
        delete this.creatures[creature.getId()]
      }
    });

    _.each(this.getWorld().getTilesByType('tree'), tile => tile.getTree().regrow())
  }

  spawn() {
    const hive: Hive = _.sample(this.world.getHives());
    const hivePositionX = hive.getX()
    const hivePositionY = hive.getY()

    let creature = null;

    const possibleSpawnLocationsX = _.range(hivePositionX -1, hivePositionX +2)
    const possibleSpawnLocationsY = _.range(hivePositionY -1, hivePositionY +2)

    const possibleSpawnLocations = [];

    _.each(possibleSpawnLocationsX, pslX => {
      _.each(possibleSpawnLocationsY, pslY => {
        if(pslX == hivePositionX && pslY == hivePositionY) return;
        if(!this.world.isEmpty(pslX, pslY)) return;
        possibleSpawnLocations.push({x: pslX, y: pslY});
      })
    })

    while(possibleSpawnLocations.length) {
      const key = _.sample(_.range(0, possibleSpawnLocations.length));
      const x = possibleSpawnLocations[key].x
      const y = possibleSpawnLocations[key].y

      creature = new Creature(this, x, y);
      break;
    }
    if(creature === null) {
      throw new Error('Could not spawn creature, no space available')
    }

    this.world.addCreature(creature);
    this.creatures[creature.getId()] = creature;

    return creature;
  }

  despawn(creature: Creature) {
    this.world.removeCreature(creature)
  }
}

export default Game;