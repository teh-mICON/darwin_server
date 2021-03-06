import _ from 'lodash'
import express from 'express'
import cors from 'cors'
import Keyv from 'keyv'

declare var PORTS

/**
 * This server takes HTTP requests from agents and stores in a key/value database
 * This is to retain information after agent restarts about species / creatures / hi scores etc.
 */
export default class API {

  private db: Keyv;
  private express;
  private port

  constructor(port) {
    this.port = port;

    this.db = new Keyv('sqlite://database/database_' + this.port + '.sqlite');
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

    // get & set
    this.express.get('/get/:key', async (request: any, response) => {
      const key = request.params.key;
      const value = await this.db.get(key)
      response.json(value);
    });
    this.express.post('/set/:key', async (request: any, response) => {
      try {
        JSON.parse(request.raw);
        await this.db.set(request.params.key, request.raw);
        response.send('ok')
      } catch(error) {
        response.status(422);
        console.log('PARSE ERROR ON', request.url)
        console.log('RAW:', typeof request.raw, request.raw)
        response.send('error parsing data')
      }
    });
  }


  listen() {
    this.express.listen(this.port);
    console.log('DatabaseServer listening on', this.port)
  }
}