import Species from './species'
import Game from './game';
class Hive {

  private id;
  private x;
  private y;

  private species: Species = null;
  private game: Game;

  constructor(game, id, x, y) {
    this.game = game;
    this.id = id;
    this.x = x;
    this.y = y;
  }

  getId() { return this.id }
  getX() { return this.x }
  getY() { return this.y }

  available() { return this.species === null }
  occupy(species) { this.species = species; }
  vacate() { this.species = null; }
  getSpecies() { return this.species; }
}

export default Hive;