// @flow

import express from 'express';
const app: express$Application = express();
const logger: any = require('./logger');
import {Database} from './database';
const config = require('./config');

module.exports = app;

const database: Database = new Database({
  path: config.get('database:path')
});


// not sure if needed
app.options('*', (req: express$Request, res: express$Response) => {

  logger.info('OPTIONS call');

  res.header('Access-Control-Allow-Origin', '*');
  res.status(200).end();
});

app.get('/:user/campaigns', (req: express$Request, res: express$Response) => {

  logger.info('GET /campaign');

  const username = req.params.user;
  const user = getUser(username);

  if (! user) {
    return res.status(404)
      .json({
        error: 'User does not exist.'
      });
  }

  const campaigns = database.getCampaigns(({user: user}));

  res.status(200)
    .header('Access-Control-Allow-Origin', '*')
    .json({campaigns: campaigns});
});

function getUser(username: string): boolean {
  const users = database.getUsers();
  let found = null;
  users.forEach((u) => {
    if (u.username === username) {
      found = u;
    }
  });
  return found;
}

function print(o) {
  return console.log(require('util').inspect(o, {showHidden: false, depth: null}));
}