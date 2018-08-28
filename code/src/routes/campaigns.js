// @flow

const Ajv = require('ajv');
const _ = require('lodash');

import type { Database } from '../database';
const {User, Campaign} = require('../business');
const getInstance = require('../database').getInstance;
const errors = require('../errors');
const schema = require('../schemas');

const database: Database = getInstance();

const ajv = new Ajv();
const campaignSchema = ajv.compile(schema.Campaign);

const router = require('express').Router();

router.post('/', (req: express$Request, res: express$Response, next: express$NextFunction) => {

  try {
    const user: User = res.locals.user;

    const campaignObject: any = req.body.campaign;
    campaignSchema(campaignObject);
    const checkResult: any = _.cloneDeep(campaignSchema);

    if (checkResult.errors) {
      return next(errors.invalidRequestStructure({
        details: checkResult.errors,
      }));
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
  } catch (e) {
    return next(e);
  }  
});

router.post('/:campaignId/cancel', (req: express$Request, res: express$Response, next: express$NextFunction) => {

  try {
    const campaignId: string = req.params.campaignId;
    const access: string = req.headers.authorization;

    const campaign: Campaign = database.campaigns.getOne({ campaignId: campaignId });

    if (campaign == null) {
      return next(errors.unknownResource({
        details: 'campaignId: ' + campaignId,
      }));
    }

    const user: User = database.users.getOne({ username: campaign.requester });
    const isAccessValid: boolean = user.isAccessValid({
      db: database,
      accessId: access
    });

    if (! isAccessValid) {
      return next(errors.forbidden({
        details: 'token: "' + access + '"',
      }));
    }

    if (campaign.status === 'cancelled') {
      return next(errors.invalidOperation({
        details: 'campaign is already cancelled. campaignId: ' + campaignId,
      }));
    }

    campaign.cancel({ db: database });

    return res.status(200)
      .json({
        campaign: campaign,
      });
  } catch (e) {
    next(e);
  }
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
