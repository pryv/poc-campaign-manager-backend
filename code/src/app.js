// @flow

import express from 'express';
const app: express$Application = express();
const bodyParser = require('body-parser');
import Ajv from 'ajv';
import _ from 'lodash';

const logger: any = require('./logger');
import {Database} from './database';
import {Campaign, Invitation, User} from './business';
const config = require('./config');

import schema from './schemas';

module.exports = app;

app.use(bodyParser.json());

const database: Database = new Database({
  path: config.get('database:path')
});

const ajv = new Ajv();
const campaignSchema = ajv.compile(schema.Campaign);
const invitationSchema = ajv.compile(schema.Invitation);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
  next();
});

// not sure if needed
app.options('*', (req: express$Request, res: express$Response) => {

  logger.info('OPTIONS call on', req.path);

  res.header('Access-Control-Allow-Origin', '*');

  res.status(200).end();
});

app.post('/:username/invitations', (req: express$Request, res: express$Response) => {

  logger.info('POST /invitations');

  const username = req.params.username;
  const user = getUser(username);
  //console.log('received for username', username);
  if (! user) {
    return res.status(400)
      .json({
        error: 'User does not exist.'
      });
  }

  const invitationObject = req.body;
  invitationSchema(invitationObject);
  const checkResult = _.cloneDeep(invitationSchema);
  //console.log('received object', invitationObject);

  if (checkResult.errors) {
    return res.status(400)
      .json({
        error: 'wrong schema',
        details: checkResult.errors
      });
  }

  const campaign = getCampaign({
    campaignId: invitationObject.campaignId,
    user: user
  });
  if (! campaign) {
    return res.status(400)
      .json({
        error: 'Campaign does not exist'
      });
  }

  const invitation = new Invitation(_.merge(invitationObject, {
    requesterId: user.id
  }));
  invitation.save({
    db: database,
    user: user
  });

  return res.status(201)
    .json({
      invitation: invitation
    });

});

app.get('/:username/invitations', (req: express$Request, res: express$Response) => {

  logger.info('GET /invitations');

  const username = req.params.username;
  const user = getUser(username);
  //console.log('received for username', username)
  if (! user) {
    return res.status(400)
      .json({
        error: 'User does not exist.'
      });
  }

  const invitations = database.getInvitations({
    requester: user
  });
  return res.status(200)
    .json({
      invitations: invitations
    });

});

app.post('/:username/campaigns', (req: express$Request, res: express$Response) => {

  logger.info('POST / campaign');

  const username = req.params.username;
  const user = getUser(username);
  //console.log('received for username', username)
  if (! user) {
    return res.status(400)
      .json({
        error: 'User does not exist.'
      });
  }

  const campaignObject = req.body;
  campaignSchema(campaignObject);
  const checkResult = _.cloneDeep(campaignSchema);
  //console.log('received object', campaignObject);

  if (checkResult.errors) {
    return res.status(400)
      .json({
        error: 'wrong schema',
        details: checkResult.errors
      });
  }

  let campaign = new Campaign(campaignObject);
  campaign = campaign.save({
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
    return res.status(400)
      .json({
        error: 'User does not exist.'
      });
  }

  const campaigns = database.getCampaigns(({user: user}));

  res.status(200)
    .header('Access-Control-Allow-Origin', '*')
    .json({campaigns: campaigns});
});

app.get('/:username/campaigns/:campaignId', (req: express$Request, res: express$Response) => {

  logger.info('GET /campaign/id');

  const username = req.params.username;
  const user = getUser(username);

  if (! user) {
    return res.status(400)
      .json({
        error: 'User does not exist.'
      });
  }

  const campaignId = req.params.campaignId;

  const campaigns = database.getCampaigns(({user: user}));
  let campaign = null;
  campaigns.forEach((c) => {
    if (c.id === campaignId) {
      campaign = c;
    }
  })

  if (! campaign) {
    return res.status(400)
      .json({
        error: 'campaign does not exist'
      });
  }

  res.status(200)
    .header('Access-Control-Allow-Origin', '*')
    .json({campaign: campaign});

});

function getCampaign(params: {
  user: User,
  campaignId: string
}): Campaign {
  const campaigns = database.getCampaigns({user: params.user});
  let found = null;
  campaigns.forEach((c) => {
    if (c.id === params.campaignId) {
      found = c;
    }
  });
  return found;
}

function getUser(username: string): User {
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