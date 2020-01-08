import Hive from './hive';
import Game from './game';
import Creature from './creature';
import * as _ from 'lodash'

class Species {

  private id: string;
  private hive: Hive;
  private game: Game;
  private creatures = {};

  constructor(game, id: string) {
    this.game = game;
    this.id = id;
  }

  setHive(hive: Hive) { this.hive = hive; }
  getHive() { return this.hive; }
  getId() { return this.id; }

  spawnCreature() {
    const hivePositionX = this.hive.getX()
    const hivePositionY = this.hive.getY()

    let spawnLocationX = hivePositionX;
    let spawnLocationY = hivePositionY - 1;

    let creature = null;

    console.log(this.game.getWorld().isEmpty(spawnLocationX, spawnLocationY))

    // try spawning on top of hive
    if (this.game.getWorld().isEmpty(spawnLocationX, spawnLocationY)) {
      creature = new Creature(this, spawnLocationX, spawnLocationY);
    }

    // try spawning top right of hive
    if (creature !== null) {
      spawnLocationX += 1;
      if (this.game.getWorld().isEmpty(spawnLocationX, spawnLocationY)) {
        creature = new Creature(this, spawnLocationX, spawnLocationY);
      }
    }
    // try spawning right of hive
    if (creature !== null) {
      spawnLocationY += 1;
      if (this.game.getWorld().isEmpty(spawnLocationX, spawnLocationY)) {
        creature = new Creature(this, spawnLocationX, spawnLocationY);
      }
    }

    // try spawning right of hive
    if (creature !== null) {
      spawnLocationY += 1;
      if (this.game.getWorld().isEmpty(spawnLocationX, spawnLocationY)) {
        creature = new Creature(this, spawnLocationX, spawnLocationY);
      }
    } else {
      // give up spawn
      throw new Error('Could not spawn creature, no space available')
    }

    this.game.getWorld().addCreature(creature);
    this.creatures[creature.getId()] = creature;

    return creature;
  }
  getCreature(id) { return this.creatures[id]; }
}

export default Species;