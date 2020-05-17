import * as _ from 'lodash'

import Simulation from './simulation/simulation';
import DatabaseServer from './database/server';
import AgentServer from './agent/server';
import UIServer from './ui/server'
import ClientServer from './client/server'

const simulation = new Simulation(200, 200);

const basePort = 8000;
const PORTS = {
  agent: basePort,
  database: basePort + 1,
  client: basePort + 2,
  ui: basePort + 3
}

// db server
new DatabaseServer(PORTS.database).listen();

// agent server
new AgentServer(simulation, PORTS).listen()

// client server
new ClientServer(PORTS).listen();

// ui server
new UIServer(simulation, PORTS).listen();

// start simulation
const tickRate = 15;

console.log('starting simulation with tickrate ', tickRate)
simulation.start(tickRate)

