import * as express from 'express'
import * as cors from 'cors'
import * as Keyv from 'keyv'
import * as _ from 'lodash'

export default class DatabaseAPI {

  private db: Keyv;
  private express;

  constructor() {
    this.db = new Keyv('sqlite://database/database.sqlite');
    this.express = express();

    this.express.use(cors());
    // middleware to set raw data to request
    this.express.use((request: any, response, next) => {
      request.raw = '';
      request.on('data', (chunk) => {
        request.raw += chunk;
      });
      request.on('end', () => {
        next();
      });
    });

    // reset
    this.express.get('/reset', async (request: any, response) => {
      this.db.set('species', '{}');
      this.db.set('elapsedTime', '0')
      this.db.set('generation', '0')
      this.db.set('uberHistory', '[{"age": 0, "elapsedTime": 0}]')
    });

    // get & set
    this.express.get('/get/:key', async (request: any, response) => {
      response.json(await this.db.get(request.params.key));
    });
    this.express.post('/set/:key', async (request: any, response) => {
      try {
        JSON.parse(request.raw);
        await this.db.set(request.params.key, request.raw);
        response.send('ok')
      } catch(error) {
        response.status(422);
        console.log('RAW:', typeof request.raw, request.raw)
        response.send('error parsing data')
      }
    });
  }


  listen(port) {
    this.express.listen(port);
  }
}