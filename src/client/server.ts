import * as WebSocket from 'ws'
import _ from 'lodash'
import axios from 'axios'
import { Worker } from 'worker_threads';
import uuid from 'uuid/v4'

const workerCount = 3;
const generationTime = 1000 * 60 * 5;

class Server {

  private ports;

  private wss;
  private sockets = [];
  private workers = [];

  private generation = 1;

  private hiscore = 45;
  private hiscores = [{
    score: 45,
    generation: 1
  }];

  private generationHiscore = 45;
  private generationHiscores = [{
    score: 45,
    generation: 1
  }];

  private intergenerationHiscores = [{
    score: 45,
    generation: 1
  }];

  constructor(ports) {
    this.init();
    this.ports = ports;
  }

  async init() {
    // give server time to start
    await new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, 5000);
    });

    // load initial parameters
    let ids;
    try {
      ids = await this.load('species_ids')
      this.hiscore = await this.load('hiscore')
      this.hiscores = await this.load('hiscores')
      this.generation = await this.load('generation')
      this.intergenerationHiscores = await this.load('intergenerationHiscores')

      console.log('generational data successfully loaded')
    } catch (error) {
      ids = _.times(workerCount, () => uuid().substr(0, 6))
      this.save('species_ids', ids)
      this.save('hiscore', this.hiscore);
      this.save('hiscores', this.hiscores);
      this.save('generation', this.generation)
      this.save('intergenerationHiscores', this.intergenerationHiscores)

      console.log('failed to load generational data. Starting from scratch.')
    }

    this.createWorkers(ids);

    // create generation interval
    setInterval(() => {
      console.log('NEW GENERATION', this.generation)

      // inform connected elements of new generation
      _.each(this.sockets, socket => {
        socket.send(JSON.stringify({ event: 'generation', generation: this.generation }))
      })

      _.each(this.workers, worker => {
        // save and close workers
        worker.postMessage({ event: 'generation' })
      });

      // save generation hiscore data
      this.intergenerationHiscores.push({ score: this.generationHiscore, generation: this.generation })
      this.generationHiscores = [{
        score: 45,
        generation: this.generation
      }];
      this.save('generation', this.generation)
      this.save('intergenerationHiscores', this.intergenerationHiscores)
      this.generationHiscore = 45;

      this.generation++;
    }, generationTime);
  }

  createWorkers(ids) {
    _.each(ids, id => {
      this.createWorker(id)
    })
  }
  createWorker(id) {
    // create workers
    const worker = new Worker(__dirname + "/../workerAdapter.js", { workerData: { file: __dirname + '/species.ts' } } as any) as any;
    worker.postMessage({ event: 'init', id, ports: this.ports })
    worker.addListener('message', (msg) => {
      if (msg.event == 'done') {
        worker.terminate();
        setTimeout(() => {
          this.createWorker(msg.id);
        }, 100)
        return;
      }
      let sendUpdate = false;

      // handle death event
      if (msg.age > this.hiscore) {
        this.hiscore = msg.age;
        this.hiscores.push({ score: msg.age, generation: this.generation })
        this.save('hiscore', this.hiscore);
        this.save('hiscores', this.hiscores);
        sendUpdate = true;
      }

      if (msg.age > this.generationHiscore) {
        this.generationHiscore = msg.age;
        this.generationHiscores.push({ score: msg.age, generation: this.generation })
        sendUpdate = true;
      }

      if (sendUpdate) {
        this.sendScoreUpdates();
      }
    })
    this.workers.push(worker)
  }

  sendScoreUpdates() {
    _.each(this.sockets, socket => this.sendScoreUpdate(socket))
  }
  sendScoreUpdate(socket) {
    socket.send(JSON.stringify({
      event: 'scores',
      generation: this.generation,
      hiscore: this.hiscore,
      hiscores: this.hiscores,
      generationHiscore: this.generationHiscore,
      generationHiscores: this.generationHiscores,
      intergenerationHiscores: this.intergenerationHiscores
    }));
  }

  listen() {
    // create socket server
    this.wss = new WebSocket.Server({ port: this.ports.client });
    this.wss.on('connection', (socket) => {
      this.sockets.push(socket)

      this.sendScoreUpdate(socket);

      socket.onmessage = messageRaw => {
        const message = JSON.parse(messageRaw.data.toString());
        console.log('CLIENT SERVER RECEIVED MSG', message)
      }


      socket.onclose = event => {
        _.remove(this.sockets, socket)
      }
    });
    console.log('Client server listening on ', this.ports.client);
  }

  async load(key) {
    const url = 'http://localhost:' + this.ports.database + '/get/' + key
    const response = await axios.get(url);
    return JSON.parse(response.data);
  }

  async save(key, value) {
    axios.post('http://localhost:' + this.ports.database + '/set/' + key, JSON.stringify(value))
  }
}

export default Server;