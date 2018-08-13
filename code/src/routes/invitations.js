// @flow

import Ajv from 'ajv';
import _ from 'lodash';
const request = require('superagent');

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

router.post('/', async (req: express$Request, res: express$Response) => {

  const invitationObject = req.body;
  invitationSchema(invitationObject);
  const checkResult = _.cloneDeep(invitationSchema);

  if (checkResult.errors) {
    return res.status(400)
      .json({
        error: 'wrong schema',
        details: checkResult.errors
      });
  }

  const campaign: Campaign = database.campaigns.getOne({
    campaignId: invitationObject.campaign.id,
  });
  if (!campaign) {
    return res.status(400)
      .json({
        error: 'Campaign does not exist.'
      });
  }

  let requestee: User = database.users.getOne(invitationObject.requestee);

  if (requestee == null) {
    return res.status(400)
      .json({
        error: 'Requestee does not exist in app.'
      });
  }

  if (invitationExists({
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
        error: 'Invitation to ' + target
        + ' for campaign ' + campaign.title + ' already exists'
      });
  }

  if (invitationObject.accessToken) {
    try {
      await isTokenValid({
        requestee: requestee.pryvUsername,
        accessToken: invitationObject.accessToken,
      });
    } catch (e) {
      if (e.status && e.status === 401) {
        return res.status(400)
          .json({
            error: 'Invalid access token.',
            details: 'Access token \"' + invitationObject.accessToken + '\" for user '
              + requestee.pryvUsername + ' is invalid'
          });
      } else if (userDoesNotExist(e)) {
        return res.status(400)
          .json({
            error: 'User does not exist',
            details: 'User ' + requestee.pryvUsername + ' does not exist.'
          });
      } else {
        return res.status(500)
          .json({
            error: 'Error while verifying access token validity',
            details: e.message,
          });
      }
    }
  }

  const requester: User = database.users.getOne({
    username: campaign.requester,
  });

  const invitation = new Invitation(_.merge(invitationObject, {
    requestee: requestee,
    campaign: campaign,
    requester: requester,
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

  const invitations = database.invitations.get({
    user: user
  });
  return res.status(200)
    .json({
      invitations: invitations
    });

});

router.put('/:invitationId', (req: express$Request, res: express$Response) => {

  const invitationId: string = req.params.invitationId;
  const invitationUpdate = req.body;

  const invitation: Invitation = database.invitations.getOne({id: invitationId});
  if (invitation == null) {
    return res.status(404)
      .json({
        error: 'Invitation does not exist.',
        details: 'invitationId: ' + invitationId
      });
  }

  const updatedInvitation = invitation.update({
    db: database,
    update: invitationUpdate });
  return res.status(200)
    .json({invitation: updatedInvitation});

});

module.exports = router;

function isTokenValid(params: {
  requestee: string,
  accessToken: string,
}): Promise<mixed> {
  return request.get('https://' + params.requestee + '.' + config.get('pryv:domain') + '/access-info?auth=' + params.accessToken)
}

function userDoesNotExist(error: mixed): boolean {
  return error.message.indexOf('ENOTFOUND') > -1
}

function invitationExists(params: {
    requestee: User,
    campaign: Campaign
}): boolean {
      const invitations: Array<Invitation> = database.invitations.get({user: params.requestee});
      let exists: boolean = false;
      invitations.forEach((i) => {
        if (i.campaign.id === params.campaign.id) {
          exists = true;
        }
      });
      return exists;
}
