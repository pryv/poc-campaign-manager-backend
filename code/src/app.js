// @flow

import express from 'express';
const bodyParser = require('body-parser');

const logger: any = require('./logger');
import {Database} from './database';
const config = require('./config');
import {callLoger, getUser, getUserNew, getUserFromQuery, checkAuth} from './middleware';
import {campaigns, invitations, users, auth} from './routes';

const app: express$Application = express();
module.exports = app;

const database: Database = new Database({
  path: config.get('database:path')
});

app.use(callLoger);
app.use(bodyParser.json());

app.get('/campaigns', getUserFromQuery({db: database}));
app.post('/campaigns', getUserNew({db: database}));

app.get('/campaigns', checkAuth({db: database}));
app.post('/campaigns', checkAuth({db: database}));

app.get('/invitations', getUserFromQuery({db: database}));

app.get('/invitations', checkAuth({db: database}));

app.get('/users/:username', checkAuth({db: database}));
app.post('/users/:username', checkAuth({db: database}));
app.put('/users/:username', checkAuth({db: database}));

app.use((req: express$Request, res: express$Response, next: express$NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization");
  next();
});

// not sure if needed
app.options('*', (req: express$Request, res: express$Response) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.status(200).end();
});

app.use('/users', users);
app.use('/invitations', invitations);
app.use('/campaigns', campaigns);
app.use('/auth', auth);
