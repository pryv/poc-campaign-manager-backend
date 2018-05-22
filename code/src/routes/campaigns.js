// @flow

import Ajv from 'ajv';
import _ from 'lodash';

const logger: any = require('../logger');
import {Database} from '../database';
import {Campaign, User} from '../business';
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

router.get('/:campaignId', (req: express$Request, res: express$Response) => {

  const user = res.locals.user;
  const campaignId = req.params.campaignId;

  let campaign = getCampaign({user: user, campaignId: campaignId});
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
