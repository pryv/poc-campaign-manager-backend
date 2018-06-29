// @flow

import Ajv from 'ajv';
import _ from 'lodash';
const sha256 = require('fast-sha256');
const nacl: any = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const logger: any = require('../logger');
import {Database} from '../database';
import {User, Campaign, Invitation} from '../business';
const config = require('../config');

import schema from '../schemas';

const database: Database = new Database({
  path: config.get('database:path')
});

const ajv = new Ajv();
const campaignSchema = ajv.compile(schema.Campaign);

const router = require('express').Router();

router.post('/', (req: express$Request, res: express$Response) => {

  const user = res.locals.user;

  const campaignObject = req.body;
  campaignSchema(campaignObject);
  const checkResult = _.cloneDeep(campaignSchema);

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

router.get('/', (req: express$Request, res: express$Response) => {

  const user = res.locals.user;

  const campaigns = database.getCampaigns(({user: user}));

  res.status(200)
    .header('Access-Control-Allow-Origin', '*')
    .json({campaigns: campaigns});
});

router.get('/title/:pryvAppId', (req: express$Request, res: express$Response) => {

  const DELTA_TIME_SECONDS = 20;

  const timestamp: number = req.query.message;
  const rawSignature: string = req.query.signature;
  const pryvUsername: string = req.query.pryvUsername;

  const campaign = database.getCampaignByAppId({
    pryvAppId: req.params.pryvAppId
  });
  const user: User = database.getUser({
    pryvUsername: pryvUsername,
  });

  if ((campaign == null) || (timestamp == null) || (rawSignature == null)) {
    return res.status(400)
      .json({
        error: 'wrong campaign or unauthorized'
      });
  }

  const raw: Array<string> = rawSignature.split(',');
  const signature: Array<number> = raw.map((itemString) => {return Number(itemString)});

  const now: number = Date.now() / 1000;

  let diff = now-timestamp;
  if (diff < 0)
    diff = -diff;

  if (diff > DELTA_TIME_SECONDS) {
    return res.status(400)
      .json({
        error: 'unauthorized because outdated timestamp'
      });
  }

  const invitation: Invitation = findInvitation({
    invitations: database.invitations.get({user: user}),
    campaign: campaign,
  });

  if (invitation == null) {
    return res.status(400)
      .json({
        error: 'wrong campaign or unauthorized.'
      })
  }

  const computedSignature: Uint8Array = Array.from(sha256.hmac(nacl.util.decodeUTF8(invitation.accessToken),
    nacl.util.decodeUTF8(timestamp + '')));
  if (! areHmacsSame({expected: computedSignature, provided: signature})) {
    return res.status(400)
      .json({
        error: 'unauthorized signature'
      });
  }

  campaign.requester = invitation.requester.username;
  campaign.invitationId = invitation.id;

  return res.status(200)
    .json({
      campaign: campaign
    });
});

router.get('/:campaignId', (req: express$Request, res: express$Response) => {

  const user = res.locals.user;
  const campaignId = req.params.campaignId;

  let campaign = database.getCampaign({user: user, campaignId: campaignId});
  if (! campaign) {
    return campaignNotExists(res);
  }

  res.status(200)
    .header('Access-Control-Allow-Origin', '*')
    .json({campaign: campaign});
});

module.exports = router;

function campaignNotExists(res: express$Response) {
  return res.status(400)
    .json({
      error: 'campaign does not exist'
    });
}

function areHmacsSame(params: {
  expected: Array<number>,
  provided: Array<number>,
}): boolean {
  if (params.expected.length !== params.provided.length)

    return false;

  for(let i=0; i<params.provided.length; i++) {
    if (params.provided[i] !== params.expected[i])
      return false;
  }

  return true;
}

function findInvitation(params: {
  invitations: Array<Invitation>,
  campaign: Campaign,
}): Invitation {
  let found = null;
  params.invitations.forEach((i) => {
    if (i.campaign.id === params.campaign.id) {
      return found = i;
    }
  });
  return found;
}

