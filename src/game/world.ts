import { uuid } from 'uuidv4';
import * as _ from 'lodash';

import Hive from './hive'
import Tree from './tree'
import Game from './game';
import Creature from './creature';
import { Tile, MountainTile, WaterTile, TreeTile, CreatureTile, HiveTile } from './tile'

const fs = require('fs').promises;

class World {
  private tiles = [] as any;
  private trees = [] as any;
  private hives = {

  };
  private creatures = [];

  private game: Game;

  constructor(game, width, height) {
    this.game = game;

    this.initialize(width, height);
  }
  async initialize(width, height) {
    try {
      const tilesJSON = await fs.readFile('world.json')
      const tiles = JSON.parse(tilesJSON);
      _.each(tiles, tile => this.addTile(tile.x, tile.y, tile.type));
      return true;
    } catch (error) {
      _.times(width, i => { this.addMountain(0, i); this.addMountain(width - 1, i) })
      _.times(height - 2, i => { this.addMountain(i + 1, 0); this.addMountain(i + 1, height - 1) })
      return false;
    }
  }

  addTile(x, y, type) {
    switch (type) {
      case 'mountain': this.addMountain(x, y); break;
      case 'water': this.addWater(x, y); break;
      case 'tree': this.addTree(x, y); break;
      case 'hive': this.addHive(x, y); break;
    }
  }

  removeTile(x, y) {
    _.remove(this.tiles, (tile: Tile) => tile.getX() == x && tile.getY() == y)
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
    const hive = new Hive(id, x, y);
    this.hives[id] = hive;
    this.tiles.push(new HiveTile(hive))
  }
  addCreature(creature: Creature) {
    this.tiles.push(new CreatureTile(creature));
    this.creatures.push(creature);
  }

  removeCreature(creature: Creature) {
    this.tiles = _.filter(this.tiles, tile => {
      if (tile.getType() != 'creature')
        return true;
      return tile.getCreature().getId() != creature.getId();
    });
  }


  getHives() { return this.hives; }

  isEmpty(x, y) {
    return !_.filter(this.tiles, tile => tile.getX() == x && tile.getY() == y).length;
  }

  getTiles() { return this.tiles; }
  getTilesByCoordinates(coordinates, speciesId = null) {
    const tiles = [];
    _.each(coordinates, coordinate => {
      const filtered = _.filter(this.tiles, (tile: Tile) => {
        return tile.getX() == coordinate.x && tile.getY() == coordinate.y
      });
      if (!filtered.length) {
        tiles.push(null)
      } else {
        tiles.push(filtered[0])
      }
    });
    return tiles;
  }
  getTilesByRange(minX, minY, maxX, maxY) {
    return _.filter(this.tiles, tile => tile.getX() >= minX && tile.getY() >= minY && tile.getX() <= maxX && tile.getY() <= maxY)
  }
  getTilesByType(type) {
    return _.filter(this.tiles, tile => tile.getType() == type);
  }

  export() {
    return _.map(this.tiles, tile => tile.toJSON());
  }

  async save() {
    console.log('SAVING')
    const tiles = _.filter(this.export(), (tile: any) => tile.type != 'creature');

    await fs.writeFile('world.json', JSON.stringify(tiles));
  }
}

export default World;