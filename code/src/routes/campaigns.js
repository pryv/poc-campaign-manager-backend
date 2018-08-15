// @flow

const Ajv = require('ajv');
const _ = require('lodash');

import type { Database } from '../database';
const {User, Campaign} = require('../business');
const getInstance = require('../database').getInstance;

const schema = require('../schemas');

const database: Database = getInstance();

const ajv = new Ajv();
const campaignSchema = ajv.compile(schema.Campaign);

const router = require('express').Router();

router.post('/', (req: express$Request, res: express$Response) => {

  const user: User = res.locals.user;

  const campaignObject: any = req.body.campaign;
  campaignSchema(campaignObject);
  const checkResult: any = _.cloneDeep(campaignSchema);

  if (checkResult.errors) {
    return res.status(400)
      .json({
        error: 'wrong schema',
        details: checkResult.errors
      });
  }

  const campaign: Campaign = new Campaign(campaignObject);
  campaign.save({
    db: database,
    user: user
  });

  return res.status(201)
    .json({
      campaign: campaign
    });
});

router.post('/:campaignId/cancel', (req: express$Request, res: express$Response) => {

  const campaignId: string = req.params.campaignId;
  const access: string = req.headers.authorization;

  const campaign: Campaign = database.campaigns.getOne({ campaignId: campaignId });

  if (campaign == null) {
    return res.status(404)
      .json({
        error: 'campaign does not exist',
        details: 'campaignId: ' + campaignId,
      });
  }

  const user: User = database.users.getOne({ username: campaign.requester });
  const isAccessValid: boolean = user.isAccessValid({
    db: database,
    accessId: access
  });

  if (! isAccessValid) {
    return res.status(403)
      .json({
        error: 'invalid token',
        details: 'token: "' + access + '"',
      });
  }

  if (campaign.status === 'cancelled') {
    return res.status(400)
      .json({
        error: 'campaign is already cancelled',
        details: 'campaignId: ' + campaignId,
      });
  }

  const cancelledCampaign: Campaign = database.campaigns.cancel({ campaign: campaign });

  return res.status(200)
    .json({
      campaign: cancelledCampaign,
    });
});

router.get('/', (req: express$Request, res: express$Response) => {

  const user: User = res.locals.user;

  const campaigns: Array<Campaign> = database.campaigns.get(({user: user}));

  res.status(200)
    .header('Access-Control-Allow-Origin', '*')
    .json({campaigns: campaigns});
});

router.get('/:campaignId', (req: express$Request, res: express$Response) => {

  const campaignId: string = req.params.campaignId;

  let campaign: Campaign = database.campaigns.getOne({campaignId: campaignId});
  if (! campaign) {
    return campaignNotExists(res);
  }

  res.status(200)
    .header('Access-Control-Allow-Origin', '*')
    .json({campaign: campaign});
});

router.get('/by-pryv-app-id/:pryvAppId', (req: express$Request, res: express$Response) => {

  const campaignPryvAppId: string = req.params.pryvAppId;

  const campaign: Campaign = database.campaigns.getOneByPryvAppId({
    pryvAppId: campaignPryvAppId
  });

  if (campaign == null) {
    return campaignNotExists(res);
  }

  res.status(200)
    .json({campaign: campaign});
});

module.exports = router;

function campaignNotExists(res: express$Response) {
  return res.status(400)
    .json({
      error: 'campaign does not exist'
    });
}
