// @flow

/* global describe, it, beforeEach */

const request: any = require('supertest');
const _ = require('lodash');

import type { Database } from '../../src/database';
const app: express$Application = require('../../src/app');
const getInstance = require('../../src/database').getInstance;

const Fixtures = require('../support/Fixtures');
const DbCleaner = require('../support/DbCleaner');
const { Campaign, User, Invitation, Access } = require('../../src/business');
const { checkInvitations, checkCampaigns, checkUsers } = require('../support/validation');
const { errorNames } = require('../../src/errors');

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
          const error = res.body.error;
          error.id.should.eql(errorNames.invalidOperation);
        });
    });

    it('should return an error with status 400 if the invitation already exists, with its id', () => {
      const requestee = fixtures.addUser({pryvOnly: true});
      const campaign = fixtures.addCampaign();
      const invitation = fixtures.addInvitation({
        campaign: campaign,
        requestee: requestee
      });

      return request(app)
        .post(makeUrl())
        .send(_.pick(invitation, [
          'campaign',
          'requestee'
        ]))
        .expect(400)
        .then(res => {
          res.body.should.have.property('error');
          res.body.should.have.property('invitationId');
          res.body.invitationId.should.eql(invitation.id);
          const error = res.body.error;
          error.id.should.eql(errorNames.invalidOperation);
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
          const error = res.body.error;
          error.id.should.eql(errorNames.invalidOperation);
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
          const error = res.body.error;
          error.id.should.eql(errorNames.invalidRequestStructure);
        });
    });

  });

  describe('when fetching invitations', () => {

    it('should return the user\'s invitations including history', async () => {

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
      campaign2 = fixtures.addCampaign({ user: user1 });
      invitation2 = fixtures.addInvitation({
        campaign: campaign1,
        requester: user1,
        requestee: user2
      });
      invitation3 = fixtures.addInvitation({
        requester: user1,
        requestee: user2,
        campaign: campaign2
      });
      invitation1.update({
        db: db,
        update: {
          status: 'accepted'
        }
      });
      invitation1.update({
        db: db,
        update: {
          status: 'cancelled'
        }
      });
      invitation2.update({
        db: db,
        update: {
          status: 'refused'
        }
      });
      invitation3.update({
        db: db,
        update: {
          status: 'seen'
        }
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

          found1.should.have.property('history');
          found2.should.have.property('history');
          found3.should.have.property('history');

          found1.history.length.should.eql(2);
          found2.history.length.should.eql(1);
          found3.history.length.should.eql(1);

          //TODO: they get updated so quick that they come in any order.
          //found1.history[0].status.should.eql('created');
          //found1.history[1].status.should.eql('cancelled');

          found2.history[0].status.should.eql('created');

          found3.history[0].status.should.eql('created');
        });
    });

    it('should return an empty array if the invitation does not have any history', () => {
      let user1, user2: User;
      let campaign1: Campaign;

      user1 = fixtures.addUser();
      const access: Access = fixtures.addAccess({ user: user1 });
      user2 = fixtures.addUser();
      campaign1 = fixtures.addCampaign({ user: user1 });
      fixtures.addInvitation({
        requester: user1,
        requestee: user2,
        campaign: campaign1
      });

      return request(app)
        .get(makeUrl())
        .query({ username: user1.username })
        .set('authorization', access.id)
        .expect(200)
        .then(res => {
          res.body.should.have.property('invitations');
          const invitations = res.body.invitations;
          invitations.length.should.eql(1);
          const retrievedInvitation: Invitation = invitations[0];
          retrievedInvitation.should.have.property('history').which.is.an.Array();
          retrievedInvitation.history.length.should.eql(0);
        });
    });

    it('should only return invitations where the caller is the requester', () => {
      const user1: User = fixtures.addUser();
      const user2: User = fixtures.addUser();
      const invitation1: Invitation = fixtures.addInvitation({
        requester: user1,
        requestee: user2,
      });
      const access: Access = fixtures.addAccess({ user: user1 });

      return request(app)
        .get(makeUrl())
        .query({ username: user1.username })
        .set('authorization', access.id)
        .expect(200)
        .then(res => {
          res.body.should.have.property('invitations');
          const invitations = res.body.invitations;
          invitations.length.should.eql(1);
          const retrievedInvitation: Invitation = invitations[0];
          checkInvitations(invitation1, retrievedInvitation);
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

});
