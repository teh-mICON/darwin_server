import Tree from "./tree";
import Creature from './creature';
import Hive from './hive';

export abstract class Tile {
  public abstract getX();
  public abstract getY();
  public abstract getType();
  public export() {
    return { type: this.getType(), x: this.getX(), y: this.getY() }
  }
}

abstract class DefaultTile extends Tile {
  protected x;
  protected y;

  constructor(x, y) {
    super();
    this.x = x;
    this.y = y;
  }

  getX() { return this.x; }
  getY() { return this.y; }
  public abstract getType();

  public toJSON() {
    return {
      x: this.x,
      y: this.y,
      type: this.getType(),
    }
  }

}

export class MountainTile extends DefaultTile {
  public getType() {
    return 'mountain';
  }
}

export class WaterTile extends DefaultTile {
  public getType() {
    return 'water';
  }
}

export class TreeTile extends DefaultTile {

  private tree: Tree;

  constructor(tree: Tree) {
    super(tree.getX(), tree.getY())
    this.tree = tree;
  }
  public getType() {
    return 'tree';
  }
  public getTree() { return this.tree; }
}

export class HiveTile extends DefaultTile {

  private hive: Hive;

  constructor(hive: Hive) {
    super(hive.getX(), hive.getY())
    this.hive = hive;
  }
  public getType() {
    return 'hive';
  }
}

export class CreatureTile extends Tile {
  private creature: Creature;

  constructor(creature: Creature) {
    super();
    this.creature = creature;
  }

  getX() { return this.creature.getX(); }
  getY() { return this.creature.getY(); }
  getCreature() { return this.creature }
  public getType() {
    return 'creature';
  }

  public toJSON() {
    return {
      x: this.getX(),
      y: this.getY(),
      type: 'creature',
      facing: this.creature.getFacing(),
      age: this.creature.getAge(),
      visibleRange: this.getCreature().getVisibleRange(),
      speciesID: this.getCreature().getSpeciesID(),
      raceID: this.getCreature().getRaceID()
    }
  }
}
