import Game from './game/game';
import Database from './database';

const fs = require('fs').promises;
const url = require('url');
const uuid = require('uuid/v4')

export default class Controller {

  private request;
  private response;
  private game: Game;
  private id;

  constructor(request, response, game) {
    this.request = request;
    this.response = response;
    this.game = game;
    this.id = uuid();

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Request-Method', '*');
    response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
    response.setHeader('Access-Control-Allow-Headers', '*');
  }

  async handleRequest() {
    switch (url.parse(this.request.url, true).pathname) {
      case '/': await this._index(); break;
      case '/world': await this._world(); break;
      case '/add_tile': await this._addTile(); break;
      case '/remove_tile': await this._removeTile(); break;
    }
    this.response.end();
  }

  private async _index() {
    if(this.request.method != 'GET') return;
    this.response.setHeader('Content-Type', 'text/html');
    this.response.writeHead(200);
    const htm = await fs.readFile('./public/index.html');
    this.response.write(htm);
  }

  private async _world() {
    if(this.request.method != 'GET') return;
    this.response.setHeader('Content-Type', 'application/json');
    this.response.writeHead(200);
    this.response.write(JSON.stringify(this.game.getWorld().export()))
  }

  private async _addTile() {
    if(this.request.method != 'GET') return;
    const chunks = url.parse(this.request.url, true);
    const x = Math.floor(chunks.query.x)
    const y = Math.floor(chunks.query.y)
    if (this.game.getWorld().isEmpty(x, y)) {
      this.game.getWorld().addTile(x, y, chunks.query.type)
      this.game.getWorld().save();
    }
    this.response.writeHead(200);
  }

  private async _removeTile() {
    if(this.request.method != 'GET') return;
    const chunks = url.parse(this.request.url, true);
    const x = chunks.query.x
    const y = chunks.query.y
    if (!this.game.getWorld().isEmpty(x, y)) {
      this.game.getWorld().removeTile(x, y)
      this.game.getWorld().save();
    }
    this.response.writeHead(200);
  }
}