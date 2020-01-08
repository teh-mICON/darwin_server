import * as _ from 'lodash'
import { uuid } from 'uuidv4'
import World from "./world";
import Hive from "./hive";
import Species from './species';
import Creature from './creature';

class Game {
  private world: World = new World(this);
  private species = {} as any;
  constructor() {

  }

  getSpecies(id) {
    return this.species[id]
  }

  registerSpecies(): string {
    const id = uuid();
    const species = new Species(this, id);
    this.species[id] = species;
    const hive = this.world.registerSpeciesToHive(species);
    species.setHive(hive);
    return species.getId();
  }
  unregisterSpecies(speciesId: string) {
    const species: Species = this.getSpecies(speciesId);
    this.species = _.filter(this.species, (species, id) => id != speciesId);

    this.world.removeCreatures(species);
    species.getHive().vacate();
  }

  getWorld() { return this.world; }
  getHiveForSpecies(species) { return this.world.getHiveForSpecies(species); }
}

export default Game;