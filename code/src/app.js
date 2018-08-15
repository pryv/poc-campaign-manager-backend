// @flow

const express = require('express');
const bodyParser = require('body-parser');

import type { Database } from './database';

const getInstance = require('./database').getInstance;
const {callLoger, getUserFromPath, getUserFromBody, getUserFromQuery, checkAuth} = require('./middleware');
const {campaigns, invitations, users, auth} = require('./routes');

const app: express$Application = express();
module.exports = app;

const database: Database = getInstance();

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
