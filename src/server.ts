import * as _ from 'lodash'

import Simulation from './simulation/simulation';
import AgentServer from './agent/server';
import DatabaseServer from './database/server'
import UIServer from './ui/server'

const simulation = new Simulation(200, 200);

// agent server
new AgentServer(simulation).listen(8000)

// db server
new DatabaseServer().listen(8001);

// ui server
new UIServer(simulation).listen(8002);

// start simulation
const tickRate = 100;
console.log('starting simulation with tickrate ', tickRate)
simulation.start(tickRate)