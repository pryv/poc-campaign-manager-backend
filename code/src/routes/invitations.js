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

  const user = res.locals.user;

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
  if (!campaign) {
    return res.status(400)
      .json({
        error: 'Campaign does not exist'
      });
  }

  const requesteeUsername = invitationObject.requestee;
  if (requesteeUsername) {
    console.log('ca devrait pas')
    const requestee = database.getUser({username: requesteeUsername});
    if (! requestee) {
      return res.status(400)
        .json({
          error: 'Requestee does not exist in Campaign management app.'
        });
    }
  }

  const invitation = new Invitation(_.merge(invitationObject, {
    requesterId: user.id,
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

router.get('/', (req: express$Request, res: express$Response) => {

  const user = res.locals.user;

  const invitations = database.getInvitations({
    requester: user
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
  const campaigns = database.getCampaigns({user: params.user});
  let found = null;
  campaigns.forEach((c) => {
    if (c.id === params.campaignId) {
      found = c;
    }
  });
  return found;
}
