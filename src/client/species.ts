import _ from 'lodash'
import uuid from 'uuid/v4'
import { parentPort, workerData } from 'worker_threads';
import axios from 'axios'

import Actor from './actor';
import Network from '../../../sonic/src/network';
import Nature from '../../../sonic/src/nature'

const actorCount = 5;
const mutations = 4;

class Species {

  private id;
  private actors = [];
  private networks = [];
  private ports;

  async init(id, ports) {
    this.id = id;
    this.ports = ports;
    try {
      const url = 'http://localhost:' + this.ports.database + '/get/species_' + id
      const response = await axios.get(url);
      this.networks = JSON.parse(response.data)
      console.log(id, 'loaded networks')
    } catch (error) {
      this.networks = this.blankNetworks(actorCount + actorCount * mutations)
      console.log(id, 'created blank networks')
    }
  }

  blankNetworks(count) {
    // specify input/output size
    let input = 0;
    input += 1; // motivation
    input += 15 // mountain
    input += 15 // water
    input += 15 // tree
    input += 15 // hive
    input += 15 // creature
    input += 3 // pain + hunger + thirst
    input += 3 // drink + eat + feed
    input += 3 // food + water + energy

    // move, turn, eat + drink + attack
    const output = 1 + 2 + 3

    // create actors
    return _.times(count, () => {
      return new Network().initRandom(input, 150, output).export()
    })
  }

  run() {
    _.each(this.networks, network => {
      const actor = new Actor(this.id, this.ports.agent, network, this.deathCallback.bind(this));
      this.actors.push(actor)
      actor.goes();
    })
  }


  deathCallback(actor, msg) {
    parentPort.postMessage({ event: 'death', age: msg.age })
  }

  addSocket(socket) { }
  removeSocket(socket) { }

  async saveAndClose() {
    const sorted = _.sortBy(this.actors, (actor) => {
      const max = _.max([actor.getAge(), actor.getMaxAge()]);
      return -max;
    });
    const generation = []
    _.each(sorted.slice(0, actorCount), (actor: Actor) => {
      generation.push(actor.getNetwork())
      _.times(mutations, () => {
        generation.push(Nature.createMutatedNetwork(actor.getNetwork(), .1))
      })
    })

    const url = 'http://localhost:' + this.ports.database + '/set/species_' + this.id
    axios.post(url, generation).then(() => {
      _.each(this.actors, actor => actor.destroy());
      parentPort.postMessage({ event: 'done', id: this.id })
    })
  }
}
const species = new Species();

parentPort.addListener('message', async (msg) => {
  if (msg.event == 'init') {
    await species.init(msg.id, msg.ports);
    species.run();
  }
  else if (msg.event == 'generation') {
    species.saveAndClose();
  }
})