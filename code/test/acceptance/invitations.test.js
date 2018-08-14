// @flow

/* global describe, it, after, beforeEach */

const request: any = require('supertest');
const should: any = require('should');
import _ from 'lodash';

const app: express$Application = require('../../src/app');
const config = require('../../src/config');
const getInstance = require('../../src/database').getInstance;

import {Fixtures} from '../support/Fixtures';
import {DbCleaner} from '../support/DbCleaner';
import type { Database } from '../../src/database';
import {Campaign, User, Invitation, Access} from '../../src/business';

import {checkInvitations, checkCampaigns, checkUsers} from '../support/validation';

describe('invitations', () => {

  const fixtures: Fixtures = new Fixtures();
  const db: Database = getInstance();
  const cleaner: DbCleaner = new DbCleaner();

  beforeEach(() => {
    return cleaner.clean();
  });

  function makeUrl(): string {
    return '/invitations';
  }

  describe('when creating an invitation', () => {

    it('should create the invitation in the database, return the created invitation with status 201', () => {
      const requester: User = fixtures.addUser({localOnly: true});
      const requestee: User = fixtures.addUser({pryvOnly: true});
      const campaign: Campaign = fixtures.addCampaign({user: requester});

      const payload: mixed = {
        campaign: _.pick(campaign, ['id']),
        requestee: _.pick(requestee, ['pryvUsername']),
      };

      return request(app)
        .post(makeUrl())
        .send(payload)
        .then(res => {
          res.status.should.eql(201);
          res.body.should.have.property('invitation').which.is.an.Object();
          const createdInvitation = res.body.invitation;
          checkUsers(requester, createdInvitation.requester);
          checkUsers(requestee, createdInvitation.requestee);
          checkCampaigns(campaign, createdInvitation.campaign);
          createdInvitation.should.have.property('id').which.is.String();
          createdInvitation.status.should.eql('created');

          const retrievedInvitation = db.invitations.getOne({id: createdInvitation.id});
          checkInvitations(createdInvitation, retrievedInvitation);
        });
    });

    it('should return an error with status 400 if the requestee does not exist', () => {
      const requestee: mixed = {
        pryvUsername: 'idontexist'
      };

      const campaign: Campaign = fixtures.addCampaign();

      const payload = {
        campaign: _.pick(campaign, ['id']),
        requestee: requestee
      };

      return request(app)
        .post(makeUrl())
        .send(payload)
        .expect(400)
        .then(res => {
          res.body.should.have.property('error');
        });
    });

    it('should return an error with status 400 if the invitation already exists', () => {
      const requestee = fixtures.addUser({pryvOnly: true});
      const campaign = fixtures.addCampaign();
      const invitation = fixtures.addInvitation({
        campaign: campaign,
        requestee: requestee
      });

      return request(app)
        .post(makeUrl())
        .send(invitation)
        .expect(400)
        .then(res => {
          res.body.should.have.property('error');
        });
    });

    it('should return a 400 when the campaign does not exist', () => {
      const requestee: User = fixtures.addUser();
      const campaign: Campaign = fixtures.getCampaign({user: requestee});

      const payload: mixed = {
        campaign: _.pick(campaign, ['id']),
        requestee: _.pick(requestee, ['pryvUsername'])
      };

      return request(app)
        .post(makeUrl())
        .send(payload)
        .expect(400)
        .then(res => {
          res.body.should.have.property('error');
        });
    });

    it('should return a 400 when the invitation schema is not respected', () => {

      const payload: mixed = {
        invalidKey: 'blopblopblop',
        campaign: { id: 'doesnotmatter' },
        requestee: { pryvUsername: 'doesNotMatter' },
      };

      return request(app)
        .post(makeUrl())
        .send(payload)
        .expect(400)
        .then(res => {
          res.body.should.have.property('error');
        });
    });

  });

  describe('when fetching invitations', () => {

    it('should return the user\'s invitations', () => {

      let user1, user2: User;
      let campaign1, campaign2: Campaign;
      let invitation1, invitation2, invitation3: Invitation;

      user1 = fixtures.addUser();
      const access: Access = fixtures.addAccess({user: user1});
      user2 = fixtures.addUser();
      campaign1 = fixtures.addCampaign({user: user1});
      invitation1 = fixtures.addInvitation({
        requester: user1,
        requestee: user2,
        campaign: campaign1
      });
      invitation2 = fixtures.addInvitation({
        campaign: campaign1,
        requester: user1,
        requestee: user2
      });
      campaign2 = fixtures.addCampaign({user: user2});
      invitation3 = fixtures.addInvitation({
        requester: user2,
        requestee: user1,
        campaign: campaign2
      });

      return request(app)
        .get(makeUrl())
        .query({username: user1.username})
        .set('authorization', access.id)
        .expect(200)
        .then(res => {
          res.body.should.have.property('invitations');
          let found1, found2, found3;
          let invitations = res.body.invitations;
          invitations.forEach((i) => {
            if (i.id === invitation1.id) {
              found1 = i;
            }
            if (i.id === invitation2.id) {
              found2 = i;
            }
            if (i.id === invitation3.id) {
              found3 = i;
            }
          });
          checkInvitations(found1, invitation1);
          checkInvitations(found2, invitation2);
          checkInvitations(found3, invitation3);
        });
    });

    it('should return an error if the user does not exist', () => {

      return request(app)
        .get(makeUrl())
        .query({username: 'unexistantUser'})
        .expect(400)
        .then(res => {
          res.body.should.have.property('error');
        });
    });

  });

  describe('when accepting invitations', () => {

    function makeUrl( id: string ) {
      return '/invitations/' + id + '/accept';
    }

    it('should return a 200 if the invitation was created', () => {
      const pryvToken: string = 'cjj8jxy0100020c0cw28xefx6';
      const requestee: User = new User({
        pryvUsername: 'testuser'
      });
      requestee.save(db);
      const invitation = fixtures.addInvitation({
        status: 'created',
        requestee: requestee,
      });

      return request(app)
        .post(makeUrl(invitation.id))
        .send({
          accessToken: pryvToken,
        })
        .then(res => {
          res.body.should.have.property('invitation');
          const updatedInvitation = res.body.invitation;
          invitation.status = 'accepted';
          checkInvitations(invitation, updatedInvitation, {
            modified: true
          });
          res.status.should.eql(200);
        });
    });

    it('should return a 400 if the access token is invalid', () => {
      const requestee: User = new User({
        pryvUsername: 'testuser'
      });
      requestee.save(db);
      const invitation = fixtures.addInvitation({
        status: 'created',
        requestee: requestee,
      });

      return request(app)
        .post(makeUrl(invitation.id))
        .send({
          accessToken: 'invalidtoken',
        })
        .then(res => {
          res.status.should.eql(400);
          res.body.should.have.property('error');
        });
    });

    it('should return a 400 if there is not "accessToken" property in the payload', () => {
      const invitation: Invitation = fixtures.addInvitation();

      return request(app)
        .post(makeUrl(invitation.id))
        .send({
          wrongProperty: 'yolo'
        })
        .then(res => {
          res.status.should.eql(400);
          res.body.should.have.property('error');
        });
    });

    it('should return a 400 if the invitation has already been accepted', () => {
      const invitation: Invitation = fixtures.addInvitation();
      invitation.update({
        db: db,
        update: { status: 'accepted'}
      });

      return request(app)
        .post(makeUrl(invitation.id))
        .send({
          accessToken: 'dontmatter',
        })
        .then(res => {
          res.status.should.eql(400);
          res.body.should.have.property('error');
        });
    });

    it('should return a 400 if the campaign has been cancelled', () => {
      const invitation: Invitation = fixtures.addInvitation();
      invitation.update({
        db: db,
        update: { status: 'cancelled'}
      });

      return request(app)
        .post(makeUrl(invitation.id))
        .send({
          accessToken: 'dontmatter',
        })
        .then(res => {
          res.status.should.eql(400);
          res.body.should.have.property('error');
        });
    });

    it('should return a 404 if the invitation does not exist', () => {

      return request(app)
        .post(makeUrl('unexistant'))
        .send({
          accessToken: 'dontmatter',
        })
        .then(res => {
          res.status.should.eql(404);
          res.body.should.have.property('error');
        });
    });
  });

  describe('when refusing invitations', () => {

    function makeUrl(invitationId) { return '/invitations/' + invitationId + '/refuse'; }

    const user: User = fixtures.addUser();

    it('should return a 200 if the invitation was created', () => {
      const requestee: User = fixtures.addUser({ pryvOnly: true });
      const invitation = fixtures.addInvitation({
        status: 'created',
        requestee: requestee,
      });

      return request(app)
        .post(makeUrl(invitation.id))
        .then(res => {
          res.status.should.eql(200);
          res.body.should.have.property('invitation');
          const refusedInvitation: Invitation = res.body.invitation;
          invitation.status = 'refused';
          checkInvitations(invitation, refusedInvitation, { modified: true });
        });
    });

    it('should return a 200 if the invitation was accepted', () => {
      const requestee: User = fixtures.addUser({ pryvOnly: true });
      const invitation = fixtures.addInvitation({
        status: 'accepted',
        requestee: requestee,
      });

      return request(app)
        .post(makeUrl(invitation.id))
        .send({})
        .then(res => {
          res.status.should.eql(200);
          res.body.should.have.property('invitation');
          const refusedInvitation: Invitation = res.body.invitation;
          invitation.status = 'refused';
          checkInvitations(invitation, refusedInvitation, { modified: true });
        });
    });

    it('should return a 400 if the invitation has already been refused', () => {
      const requestee: User = fixtures.addUser({ pryvOnly: true });
      const invitation = fixtures.addInvitation({
        status: 'refused',
        requestee: requestee,
      });

      return request(app)
        .post(makeUrl(invitation.id))
        .send({})
        .then(res => {
          res.status.should.eql(400);
          res.body.should.have.property('error');
        });
    });

    it('should return a 400 if the campaign is cancelled', () => {
      const requestee: User = fixtures.addUser({ pryvOnly: true });
      const invitation = fixtures.addInvitation({
        status: 'cancelled',
        requestee: requestee,
      });

      return request(app)
        .post(makeUrl(invitation.id))
        .send({})
        .then(res => {
          res.status.should.eql(400);
          res.body.should.have.property('error');
        });
    });

    it('should return a 404 if the invitation does not exist', () => {
      return request(app)
        .post(makeUrl('nonexistentId'))
        .send({})
        .then(res => {
          res.status.should.eql(404);
          res.body.should.have.property('error');
        });
    });
  });

  describe.skip('when updating invitations',  () => {

    it ('should return a 200 when the invitation is updated from created to accepted', () => {
      const pryvToken: string = 'cjj8jxy0100020c0cw28xefx6';
      const requestee: User = new User({
        pryvUsername: 'testuser'
      });
      requestee.save(db);
      const invitation = fixtures.addInvitation({
        status: 'created',
        requestee: requestee,
      });

      return request(app)
        .put('/invitations/' + invitation.id)
        .send({
          status: 'accepted',
          accessToken: pryvToken,
        })
        .then(res => {
          res.body.should.have.property('invitation');
          const updatedInvitation = res.body.invitation;
          invitation.status = 'accepted';
          checkInvitations(invitation, updatedInvitation, {
            modified: true
          });
          res.status.should.eql(200);
        });
    });

    it('should return a 200 when the invitation is updated from created to refused', () => {
      const invitation = fixtures.addInvitation({ status: 'created'});

      return request(app)
        .put('/invitations/' + invitation.id)
        .send({
          status: 'refused'
        })
        .then(res => {
          res.body.should.have.property('invitation');
          const updatedInvitation = res.body.invitation;
          invitation.status = 'refused';
          checkInvitations(invitation, updatedInvitation, {modified: true});
          res.status.should.eql(200);
        });
    });

    it('should return a 400 if the access token is invalid', () => {
      const invitation = fixtures.addInvitation({
        status: 'created',
        requestee: new User({
          pryvUsername: 'testuser'
        }),
      });

      return request(app)
        .put('/invitations/' + invitation.id)
        .send({
          status: 'accepted',
          accessToken: 'cinvalidtoken',
        })
        .then(res => {
          res.status.should.eql(404);
          res.body.should.have.property('error');
        });
    });

    it('should return a 404 if the invitation does not exist', () => {

      return request(app)
        .put('/invitations/unexistant-id')
        .send({})
        .then(res => {
          res.status.should.eql(404);
          res.body.should.have.property('error');
        });
    });

  });

});
