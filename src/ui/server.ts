import * as http from 'http';

import Simulation from '../simulation/simulation';

const fs = require('fs').promises;
const url = require('url');
const uuid = require('uuid/v4')

declare var PORTS;
/**
 * This server handles HTTP request towards the game state from a neutral context.
 * No agent is involved in these requests. The main purpose is to handle requests
 * about world state and altering it (e.g. creating new tiles)
 * 
 * It is seperated from AgentServer because
 * a) No agents involved
 * b) express does not play nice with `Simulation` so raw http server is used here.
 */
export default class UIServer {
  
  private simulation: Simulation;
  private ports;
  
  constructor(simulation, ports) {
    this.simulation = simulation;
    this.ports = ports;
  }

  listen() {
    http.createServer(async (request, response) => {
      const controller = new Handler(request, response, this.simulation);
      controller.handleRequest();
    }).listen(this.ports.ui);

    console.log('UIServer listening on', this.ports.ui)
  }
}

class Handler {

  private request;
  private response;
  private simulation: Simulation;

  constructor(request, response, simulation) {
    this.request = request;
    this.response = response;
    this.simulation = simulation;

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Request-Method', '*');
    response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
    response.setHeader('Access-Control-Allow-Headers', '*');
  }

  async handleRequest() {
    switch (url.parse(this.request.url, true).pathname) {
      case '/world': await this._world(); break;
      case '/add_tile': await this._addTile(); break;
      case '/remove_tile': await this._removeTile(); break;
    }
    this.response.end();
  }

  private async _world() {
    if(this.request.method != 'GET') return;
    this.response.setHeader('Content-Type', 'application/json');
    this.response.writeHead(200);
    this.response.write(JSON.stringify(this.simulation.getWorld().export()))
  }

  private async _addTile() {
    if(this.request.method != 'GET') return;
    const chunks = url.parse(this.request.url, true);
    const x = Math.floor(chunks.query.x)
    const y = Math.floor(chunks.query.y)
    if (this.simulation.getWorld().isEmpty(x, y)) {
      this.simulation.getWorld().addTile(x, y, chunks.query.type)
      this.simulation.getWorld().save();
    }
    this.response.writeHead(200);
  }

  private async _removeTile() {
    if(this.request.method != 'GET') return;
    const chunks = url.parse(this.request.url, true);
    const x = chunks.query.x
    const y = chunks.query.y
    if (!this.simulation.getWorld().isEmpty(x, y)) {
      this.simulation.getWorld().removeTile(x, y)
      this.simulation.getWorld().save();
    }
    this.response.writeHead(200);
  }
}