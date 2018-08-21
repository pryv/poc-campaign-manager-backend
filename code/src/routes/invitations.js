// @flow

const Ajv = require('ajv');
const _ = require('lodash');
const request = require('superagent');

import type { Database } from '../database';

const {Campaign, Invitation, User} = require('../business');
const config = require('../config');
const getInstance = require('../database').getInstance;
const schema = require('../schemas');

const database: Database = getInstance();

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

router.post('/:invitationId/accept', async (req: express$Request, res: express$Response) => {

  const invitationId: string = req.params.invitationId;
  const accessToken: string = req.body.accessToken;

  if (accessToken == null) {
    return res.status(400)
      .json({
        error: 'wrong schema',
        details: 'accessToken is missing'
      });
  }

  const invitation: Invitation = database.invitations.getOne({ id: invitationId});

  if (invitation == null) {
    return res.status(404)
      .json({
        error: 'Invitation does not exist.',
        details: 'invitationId: ' + invitationId,
      });
  }

  if (invitation.status == 'accepted') {
    return res.status(400)
      .json({
        error: 'Invitation has already been accepted',
        details: 'invitationId: ' + invitationId,
      });
  }

  if (invitation.status == 'cancelled') {
    return res.status(400)
      .json({
        error: 'Campaign is cancelled.',
        details: 'invitationId: ' + invitationId,
      });
  }

  const requestee: User = invitation.requestee;

  try {
    await isTokenValid({
      requestee: requestee.pryvUsername,
      accessToken: accessToken,
    });
  } catch (e) {
    if (e.status && e.status === 401) {
      return res.status(400)
        .json({
          error: 'Invalid access token.',
          details: 'Access token "' + accessToken + '" for user '
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

  const acceptedInvitation: Invitation = invitation.update({
    db: database,
    update: {
      status: 'accepted',
      accessToken: accessToken,
    }
  });

  return res.status(200)
    .json({
      invitation: acceptedInvitation
    });

});

router.post('/:invitationId/refuse', (req: express$Request, res: express$Response) => {

  const invitationId: string = req.params.invitationId;

  const invitation: Invitation = database.invitations.getOne({ id: invitationId });

  if (invitation == null) {
    return res.status(404)
      .json({
        error: 'Invitation does not exist.',
        details: 'invitationId: ' + invitationId,
      });
  }

  if (invitation.status == 'refused') {
    return res.status(400)
      .json({
        error: 'Invitation has already been refused',
        details: 'invitationId: ' + invitationId,
      });
  }

  if (invitation.status == 'cancelled') {
    return res.status(400)
      .json({
        error: 'Campaign is cancelled.',
        details: 'invitationId: ' + invitationId,
      });
  }

  const refusedInvitation: Invitation = invitation.update({
    db: database,
    update: {
      status: 'refused',
    },
  });

  return res.status(200)
    .json({
      invitation: refusedInvitation
    });
});

router.get('/', (req: express$Request, res: express$Response) => {

  const user: User = res.locals.user;

  const invitations: Array<Invitation> = database.invitations.getRequested({
    user: user
  });
  return res.status(200)
    .json({
      invitations: bundleHistory(invitations)
    });

});

module.exports = router;

function bundleHistory(invitations: Array<Invitation>): Array<Invitation> {
  const invitationsMap: Map<string, Invitation> = {};
  const invitationsWithHistory: Array<Invitation> = [];

  invitations.forEach((i) => {
    i.history = [];
    if (i.headId == null) {
      invitationsMap[i.id] = i;
    }
  });
  invitations.forEach((i) => {
    if (i.headId != null) {
      invitationsMap[i.headId].history.push(i);
    }
  });
  Object.values(invitationsMap).forEach((i) => {
    invitationsWithHistory.push(i);
  });
  return invitationsWithHistory;
}

function isTokenValid(params: {
  requestee: string,
  accessToken: string,
}): Promise<mixed> {
  return request.get('https://' + params.requestee + '.' + config.get('pryv:domain') + '/access-info?auth=' + params.accessToken);
}

function userDoesNotExist(error: mixed): boolean {
  return error.message.indexOf('ENOTFOUND') > -1;
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
