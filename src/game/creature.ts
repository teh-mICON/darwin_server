import { uuid } from 'uuidv4'
import * as _ from 'lodash'
import Handler from 'src/handler';
import Game from './game'

class Creature {
  private game: Game;
  private x;
  private y;
  private id = uuid();
  private speciesId = '';
  private facing = 'down';

  private food = 10;
  private water = 10;
  private energy = 100;
  private age = 0;

  private statuOnTick = true;

  private move = 0;

  private handler: Handler;

  constructor(game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;

  }
  setHandler(handler: Handler) { this.handler = handler; }

  getX() { return this.x; }
  getY() { return this.y; }
  getId() { return this.id; }
  getFacing() { return this.facing }
  getAge() { return this.age; }
  getFood() { return this.food }
  getWater() { return this.water }
  getEnergy() { return this.energy }
  setStatusOnTick(status) { this.statuOnTick = status; }

  setSpeciesId(speciesId) { this.speciesId = speciesId; }
  getSpeciesId() { return this.speciesId; }

  getMove() { return this.move }

  turn(direction) {
    this.facing = direction;
    this.handler.send('turn', { direction });
  }
  moveTo(x, y) {
    this.x = x;
    this.y = y;
    this.move += 3;
  }

  getVisibleRange() {
    switch (this.facing) {
      case 'up':
        return { minX: this.x - 2, minY: this.y - 3, maxX: this.x + 3, maxY: this.y }
      case 'right':
        return { minX: this.x + 1, minY: this.y - 2, maxX: this.x + 4, maxY: this.y + 3 }
      case 'down':
        return { minX: this.x - 2, minY: this.y + 1, maxX: this.x + 3, maxY: this.y + 4 }
      case 'left':
        return { minX: this.x - 3, minY: this.y - 2, maxX: this.x, maxY: this.y + 3 }
    }
  }

  getVicinity() {
    return { minX: this.x - 1, minY: this.y - 1, maxX: this.x + 2, maxY: this.y + 2 }
  }

  pain(intensity) {
    this.energy -= intensity;
    this.handler.send('pain', { intensity: 1 });
  }
  eat(food) {
    this.food += food;
    this.handler.send('eat', { food });
  }
  drink(water) {
    this.water += water;
    this.handler.send('drink', { water });
  }
  feed(creature) {
    creature.pain(1);
    this.energy += 1;
    this.handler.send('feed')
  }

  takeEnergy(amount) { this.energy -= amount }
  tick() {
    this.age++
    this.food -= .01;
    this.water -= .01;

    // hungry
    if (this.food <= -1) {
      this.handler.send('hunger', { intensity: this.food })
      this.energy -= 1;
    }
    else if (this.food <= .1) {
      this.handler.send('hunger', { intensity: .1 })
      this.energy -= .1;
    }
    // thirsty
    if (this.water <= -1) {
      this.handler.send('thirst', { intensity: this.water })
      this.energy -= 1;
    }
    else if (this.water <= .1) {
      this.handler.send('thirst', { intensity: .1 })
      this.energy -= .1;
    }

    if (--this.move < 0) {
      this.energy += this.move / 10;
    }

    if (this.statuOnTick) {
      this.handler.status();
      this.statuOnTick = false;
    }
  }

  getVisibleCoordinates() {
    // lodash range stops _before_ end
    const range = (start, end) => {
      const result = [];
      if(start < end) {
        for(let i = start; i <= end; i++) {
          result.push(i);
        }
      } else {
        for(let i = start; i >= end; i--) {
          result.push(i);
        }
      }
      return result;
    }
    let coordinates = []
    let xRange, yRange;
    switch (this.facing) {
      case 'up':
        xRange = range(this.x -2, this.x +2);
        yRange = range(this.y -3, this.y -1);
        _.each(yRange, y => {
          _.each(xRange, x => {
            coordinates.push({x, y})
          })
        })
        return coordinates;
      case 'right':
        yRange = range(this.y +2, this.y -2);
        xRange = range(this.x +3, this.x +1);
        _.each(xRange, x => {
          _.each(yRange, y => {
            coordinates.push({x, y})
          })
        })
        return coordinates;
      case 'down':
        xRange = range(this.x +2, this.x -2);
        yRange = range(this.y +3, this.y +1);
        _.each(yRange, y => {
          _.each(xRange, x => {
            coordinates.push({x, y})
          })
        })
        return coordinates;
      case 'left':
        yRange = range(this.y -2, this.y +2);
        xRange = range(this.x -3, this.x -1);
        _.each(xRange, x => {
          _.each(yRange, y => {
            coordinates.push({x, y})
          })
        })
        return coordinates;
    }
  }
  getVision() {
    const coordinates = this.getVisibleCoordinates();
    const tiles = this.game.getWorld().getTilesByCoordinates(coordinates, this.speciesId);
    return tiles;
  }

  die() {
    this.handler.die(this.age)
  }

  export() {
    return {
      food: this.food,
      water: this.water,
      energy: this.energy,
      age: this.age,
      speciesId: this.speciesId,
      vision: _.map(this.getVision(), tile => tile !== null ? tile.toJSON() : null)
    }
  }
}

export default Creature;