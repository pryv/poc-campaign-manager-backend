// @flow

import express from 'express';
const app: express$Application = express();
const bodyParser = require('body-parser');
import Ajv from 'ajv';
import _ from 'lodash';

const logger: any = require('./logger');
import {Database} from './database';
import {Campaign} from './business';
const config = require('./config');

import schema from './schemas';

module.exports = app;

app.use(bodyParser.json());

const database: Database = new Database({
  path: config.get('database:path')
});

const ajv = new Ajv();
const campaignSchema = ajv.compile(schema.Campaign);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
  next();
});

// not sure if needed
app.options('*', (req: express$Request, res: express$Response) => {

  logger.info('OPTIONS call');

  res.header('Access-Control-Allow-Origin', '*');
  res.status(200).end();
});

app.post('/:username/campaigns', (req: express$Request, res: express$Response) => {

  logger.info('POST / campaign');

  const username = req.params.username;
  const user = getUser(username);

  if (! user) {
    return res.status(404)
      .json({
        error: 'User does not exist.'
      });
  }

  const campaignObject = req.body;
  campaignSchema(campaignObject);
  const checkResult = _.cloneDeep(campaignSchema);
  console.log('received object', campaignObject);
  if (checkResult.errors) {
    return res.status(400)
      .json({
        error: 'wrong schema',
        details: checkResult.errors
      });
  }

  const campaign = new Campaign(campaignObject);
  campaign.save({
    db: database,
    user: user
  });

  return res.status(201)
    .json({
      campaign: campaign
    });
});

app.get('/:username/campaigns', (req: express$Request, res: express$Response) => {

  logger.info('GET /campaign');

  const username = req.params.username;
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