// @flow

import express from 'express';
const bodyParser = require('body-parser');

import {Database} from './database';
const config = require('./config');
import {callLoger, getUserFromPath, getUserFromBody, getUserFromQuery, checkAuth} from './middleware';
import {campaigns, invitations, users, auth} from './routes';

const app: express$Application = express();
module.exports = app;

const database: Database = new Database({
  path: config.get('database:path')
});

app.use(callLoger);
app.use(bodyParser.json());
app.disable('x-powered-by');

app.use((req: express$Request, res: express$Response, next: express$NextFunction) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT');
  res.header('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization');
  next();
});

// not sure if needed
app.options('*', (req: express$Request, res: express$Response) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.status(200).end();
});



/**
 * Campaigns
 */
app.get('/campaigns', getUserFromQuery({db: database}));
app.post('/campaigns', getUserFromBody({db: database}));

app.get('/campaigns', checkAuth({db: database}));
app.post('/campaigns', checkAuth({db: database}));

app.use('/campaigns', campaigns);

/**
 * Invitations
 */
app.get('/invitations', getUserFromQuery({db: database}));

app.get('/invitations', checkAuth({db: database}));

app.use('/invitations', invitations);

/**
 * Users
 */
app.get('/users/:username', getUserFromPath({db: database}));
app.put('/users/:username', getUserFromPath({db: database}));

app.get('/users/:username', checkAuth({db: database}));
app.put('/users/:username', checkAuth({db: database}));

app.use('/users', users);

/**
 * Auth
 */
app.use('/auth', auth);
