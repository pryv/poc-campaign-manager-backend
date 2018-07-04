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

  const campaignObject = req.body.campaign;
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

  const campaigns = database.campaigns.get(({user: user}));

  res.status(200)
    .header('Access-Control-Allow-Origin', '*')
    .json({campaigns: campaigns});
});

router.get('/:campaignId', (req: express$Request, res: express$Response) => {

  const campaignId = req.params.campaignId;

  let campaign = database.campaigns.getOne({campaignId: campaignId});
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
