import { uuid } from 'uuidv4'
import Species from './species';

class Creature {
  private x;
  private y;
  private id = uuid();
  private facing = 'down';
  private species: Species;

  constructor(species, x, y) {
    this.x = x;
    this.y = y;
    this.species = species;
  }

  getX() { return this.x; }
  getY() { return this.y; }
  getId() { return this.id; }
  getFacing() { return 'down' }
  getSpecies() { return this.species; }
  turn(direction) { this.facing = direction }

  moveTo(x, y) {
    console.log('MOVING creature', this.id, x, y)
    this.x = x;
    this.y = y;
  }

  getVisibleRange() {
    console.log('FACING', this.facing)
    switch (this.facing) {
      case 'up':
        return { minX: this.x -2, minY: this.y -2, maxX: this.x +2, maxY: this.y }
      case 'right':
        return { minX: this.x +3, minY: this.y -2, maxX: this.x, maxY: this.y -3 }
      case 'down':
        return { minX: this.x -2, minY: this.y + 1, maxX: this.x +3, maxY: this.y +3 }
      case 'left':
        return { minX: this.x -2, minY: this.y -2, maxX: this.x, maxY: this.y +3 }
    }
  }
}

export default Creature;