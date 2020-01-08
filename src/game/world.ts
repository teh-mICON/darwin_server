import { uuid } from 'uuidv4';
import * as _ from 'lodash';

import Hive from './hive'
import Tree from './tree'
import Game from './game';
import Creature from './creature';
import { MountainTile, WaterTile, TreeTile, CreatureTile, HiveTile } from './tile'
import Species from './species';
class World {
  private tiles = [] as any;
  private trees = [] as any;
  private hives = {

  };
  private creatures = [];

  private game: Game;

  constructor(game) {
    this.game = game;

    this.addWater(10, 10);
    this.addWater(11, 10);
    this.addWater(12, 10);
    this.addWater(12, 11);
    this.addWater(13, 11);
    this.addWater(13, 12);
    this.addWater(14, 12);

    this.addWater(70, 30);
    this.addWater(71, 30);
    this.addWater(72, 30);
    this.addWater(71, 31);
    this.addWater(71, 31);
    this.addWater(71, 32);
    this.addWater(71, 33);
    this.addWater(71, 34);
    this.addWater(71, 35);
    this.addWater(70, 34);

    this.addTree(30, 30);
    this.addTree(70, 24);
    this.addTree(90, 42);

    _.times(100, i => { this.addMountain(i, 0); this.addMountain(i, 49) })
    _.times(50, i => { this.addMountain(0, i); this.addMountain(99, i) })
    this.addMountain(50, 30);
    this.addMountain(50, 31);
    this.addMountain(50, 32);
    this.addMountain(50, 33);
    this.addMountain(51, 33);
    this.addMountain(51, 34);
    this.addMountain(51, 35);
    this.addMountain(52, 35);
    this.addMountain(53, 35);
    this.addMountain(53, 36);

    this.addHive(10, 40)
    this.addHive(90, 10)
  }

  addMountain(x, y) {
    this.tiles.push(new MountainTile(x, y))
  }
  addWater(x, y) {
    this.tiles.push(new WaterTile(x, y))
  }
  addTree(x, y) {
    const tree = new Tree(x, y);
    this.trees.push(tree)
    this.tiles.push(new TreeTile(tree))
  }
  addHive(x, y) {
    const id = uuid();
    const hive = new Hive(this, id, x, y);
    this.hives[id] = hive;
    this.tiles.push(new HiveTile(hive))
  }
  addCreature(creature: Creature) {
    this.tiles.push(new CreatureTile(creature));
    this.creatures.push(creature);
  }

  removeCreatures(species: Species) {
    this.tiles = _.filter(this.tiles, tile => {
      if (tile.getType() != 'creature')
        return true;
      return tile.getCreature().getSpecies().getId() != species.getId();
    });
  }

  registerSpeciesToHive(species) {
    let hive = null;
    _.each(this.hives, (possibleHive: Hive) => {
      if (possibleHive.available()) {
        hive = possibleHive;
        hive.occupy(species)
        return false;
      }
    })
    if (hive === null) throw new Error('no available hives')
    return hive;
  }

  getHiveForSpecies(species) {
    return _.find(this.hives, (hive: Hive) => hive.getSpecies() == species);
  }

  isEmpty(x, y) {
    return !_.filter(this.tiles, tile => tile.getX() == x && tile.getY() == y).length;
  }

  getTiles(minX, minY, maxX, maxY) {
    /*_.map(this.tiles, tile => {
      console.log(tile.export(),
      tile.getX() >= minX, tile.getY() >= minY, tile.getX() <= maxX, tile.getY <= maxY)
    })*/
    console.log('ACCESSING TILES', minX, minY, maxX, maxY)
    return _.filter(this.tiles, tile => tile.getX() >= minX && tile.getY() >= minY && tile.getX() <= maxX && tile.getY <= maxY)
  }

  export() {
    return _.map(this.tiles, tile => {
      if(tile.getType() != 'creature')
        return { x: tile.getX(), y: tile.getY(), type: tile.getType() }
      else
      return { x: tile.getX(), y: tile.getY(), type: tile.getType(), visibleRange: tile.getCreature().getVisibleRange(), facing: tile.getCreature().getFacing() }
    });
  }
}

export default World;