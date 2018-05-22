// @flow

import Ajv from 'ajv';
import _ from 'lodash';

const logger: any = require('../logger');
import {Database} from '../database';
import {Campaign, Invitation, User} from '../business';
const config = require('../config');

import schema from '../schemas';

const database: Database = new Database({
  path: config.get('database:path')
});

const ajv = new Ajv();
const invitationSchema = ajv.compile(schema.Invitation);

const router = require('express').Router();

router.post('/', (req: express$Request, res: express$Response) => {

  const requester: User = res.locals.user;

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

  const campaign: Campaign = getCampaign({
    campaignId: invitationObject.campaign.id,
    user: requester
  });
  if (!campaign) {
    return res.status(400)
      .json({
        error: 'Campaign does not exist.'
      });
  }

  let requestee: User = database.getUser(invitationObject.requestee);

  if (requestee == null) {
    return res.status(400)
      .json({
        error: 'Requestee does not exist in app.'
      });
  }

  if (invitationExists({
    requester: requester,
    requestee: requestee,
    campaign: campaign
  })) {
    let target: string = null;
    if (requestee.pryvUsername != null) {
      target = requestee.pryvUsername;
    } else {
      target = requestee.username;
    }
    return res.status(400)
      .json({
        error: 'Invitation from ' + requester.username + ' to ' + target
        + ' for campaign ' + campaign.title + ' already exists'
      });
  }

  const invitation = new Invitation(_.merge(invitationObject, {
    requester: requester,
    requestee: requestee,
    campaign: campaign
  }));
  invitation.save({
    db: database,
  });

  return res.status(201)
    .json({
      invitation: invitation
    });

});

router.get('/', (req: express$Request, res: express$Response) => {

  const user = res.locals.user;

  const invitations = database.getInvitations({
    user: user
  });
  return res.status(200)
    .json({
      invitations: invitations
    });

});

module.exports = router;

function getCampaign(params: {
  user: User,
  campaignId: string
}): Campaign {
  const campaigns: Array<Campaign> = database.getCampaigns({user: params.user});
  let found = null;
  campaigns.forEach((c) => {
    if (c.id === params.campaignId) {
      found = c;
    }
  });
  return found;
}

function invitationExists(params: {
    requester: User,
    requestee: User,
    campaign: Campaign
}): boolean {
      const invitations: Array<Invitation> = database.getInvitations({user: params.requester});
      let exists: boolean = false;
      invitations.forEach((i) => {
        if (i.campaign.id === params.campaign.id && i.requestee.id === params.requestee.id) {
          exists = true;
        }
      });
      return exists;
}
