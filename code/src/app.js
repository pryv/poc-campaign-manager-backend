// @flow

import express from 'express';
const bodyParser = require('body-parser');
import Ajv from 'ajv';

const logger: any = require('./logger');
import {Database} from './database';
const config = require('./config');
import {callLoger, getUser} from './middleware';
import schema from './schemas';
import {campaigns, invitations, users} from './routes';

const app: express$Application = express();
module.exports = app;

const database: Database = new Database({
  path: config.get('database:path')
});

const ajv = new Ajv();
const campaignSchema = ajv.compile(schema.Campaign);

app.use(callLoger);
app.use(bodyParser.json());
app.all('/:username/invitations', getUser({db: database}));
app.all('/:username/campaigns', getUser({db: database}));
app.all('/:username/campaigns/:campaignId', getUser({db: database}));

app.use((req: express$Request, res: express$Response, next: express$NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
  next();
});

// not sure if needed
app.options('*', (req: express$Request, res: express$Response) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.status(200).end();
});

app.use('/users', users);
app.use('/:username/invitations', invitations);
app.use('/:username/campaigns', campaigns);

