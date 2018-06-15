// @flow

/* global describe, it, before, after */

const request: any = require('supertest');
const should: any = require('should');
import _ from 'lodash';

const app: express$Application = require('../../src/app');
const config = require('../../src/config');

import {Fixtures} from '../support/Fixtures';
import {DbCleaner} from '../support/DbCleaner';
import {Database} from '../../src/database';
import {Campaign, User, Invitation} from '../../src/business';

import {checkInvitations, checkCampaigns, checkUsers} from '../support/validation';

const DB_PATH = config.get('database:path');

describe('invitations', () => {

  let fixtures: Fixtures = new Fixtures();
  let db: Database = new Database({path: DB_PATH});
  let cleaner: DbCleaner = new DbCleaner();

  beforeEach(() => {
    return cleaner.clean();
  });

  after(() => {
    fixtures.close();
  });


  function makeUrl(params: {
    username: string
  }): string {
    return '/' + params.username + '/invitations';
  }

  describe('when creating an invitation', () => {

    it('should return a 400 when the requester does not exist', () => {
      const requester = {
        id: 'idontexist',
        username: 'idontexist'
      };
      const campaign = fixtures.getCampaign({user: requester});

      const invitation = fixtures.getInvitation({
        campaign: campaign,
        requester: requester
      });

      return request(app)
        .post(makeUrl({username: requester.username}))
        .send(invitation)
        .expect(400)
        .then(res => {
          res.body.should.have.property('error');
        });
    });

    it('should return a 400 with an error message when the requestee is the requester', () => {
      const requester: User = fixtures.addUser();
      const campaign: Campaign = fixtures.addCampaign({user: requester});

      const invitation = fixtures.getInvitation({
        campaign: campaign,
        requester: requester,
        requestee: requester,
      });

      return request(app)
        .post(makeUrl({username: requester.username}))
        .send(invitation)
        .then(res => {
          res.status.should.eql(400);
          res.body.should.have.property('error');
        });
    });

    it('should return a 400 when the campaign does not exist', () => {

      const requester: User = fixtures.addUser();
      const requestee: User = fixtures.addUser();
      const unexistantCampaign = fixtures.getCampaign({user: requester});

      const invitation = fixtures.getInvitation({
        requester: requester,
        requestee: requestee,
        campaign: unexistantCampaign
      });

      return request(app)
        .post(makeUrl({username: requester.username}))
        .send(invitation)
        .expect(400)
        .then(res => {
          res.body.should.have.property('error');
        });
    });

    it('should return a 400 when the invitation schema is not respected', () => {

      const requester: User = fixtures.addUser();

      const invalidInvitation = {
        invalidKey: 'blopblopblop'
      };

      return request(app)
        .post(makeUrl({username: requester.username}))
        .send(invalidInvitation)
        .expect(400)
        .then(res => {
          res.body.should.have.property('error');
        });
    });

    describe('following a targeted invitation', () => {

      it('should create the invitation in the database, return the created invitation with status 201', () => {
        const requester = fixtures.addUser({localOnly: true});
        const requestee = fixtures.addUser({pryvOnly: true});
        const campaign = fixtures.addCampaign({user: requester});

        const invitation = {
          campaign: _.pick(campaign, ['id']),
          requester: _.pick(requester, ['username']),
          requestee: _.pick(requestee, ['pryvUsername']),
        };

        return request(app)
          .post(makeUrl({username: requester.username}))
          .send(invitation)
          .then(res => {
            res.status.should.eql(201);
            res.body.should.have.property('invitation').which.is.an.Object();
            const createdInvitation = res.body.invitation;
            checkUsers(requester, createdInvitation.requester);
            checkUsers(requestee, createdInvitation.requestee);
            checkCampaigns(campaign, createdInvitation.campaign);
            createdInvitation.should.have.property('id').which.is.String();
            createdInvitation.status.should.eql('created');

            const retrievedInvitation = db.getInvitation({id: createdInvitation.id});
            checkInvitations(createdInvitation, retrievedInvitation);

            const requesteeInvitations = db.getInvitations({user: requestee});
            let found = null;
            requesteeInvitations.forEach((i) => {
              if (i.id === createdInvitation.id) {
                found = i;
              }
            });
            checkInvitations(createdInvitation, found);
          });
      });

      it('should return an error with status 400 if the requestee does not exist', () => {
        const requester = fixtures.addUser();
        const requestee = {
          pryvUsername: 'idontexist'
        };

        const campaign = fixtures.addCampaign({user: requester});

        const invitation = fixtures.getInvitation({
          campaign: campaign,
          requester: requester,
          requestee: requestee
        });

        return request(app)
          .post(makeUrl({username: requester.username}))
          .send(invitation)
          .expect(400)
          .then(res => {
            res.body.should.have.property('error');
          });
      });

      it('should return an error with status 400 if the invitation already exists', () => {
        const requester = fixtures.addUser();
        const requestee = fixtures.addUser({pryvOnly: true});
        const campaign = fixtures.addCampaign({user: requester});
        const invitation = fixtures.addInvitation({
          campaign: campaign,
          requester: requester,
          requestee: requestee
        });

        return request(app)
          .post(makeUrl({username: requester.username}))
          .send(invitation)
          .expect(400)
          .then(res => {
            res.body.should.have.property('error');
          });
      });

    });

    describe('following an anonymous invitation', () => {

      it('should create create the invitation in the database, return the created invitation with status 201', async () => {
        const requester = fixtures.addUser();
        const requestee = fixtures.addUser({pryvOnly: true});
        const campaign = fixtures.addCampaign({user: requester});

        const invitation = {
          status: 'accepted',
          campaign: _.pick(campaign, ['id']),
          requester: _.pick(requester, ['username']),
          requestee: _.pick(requestee, ['pryvUsername']),
        };

        return request(app)
          .post(makeUrl({username: requester.username}))
          .send(invitation)
          .then(res => {
            const body = res.body;
            const status = res.status;
            status.should.eql(201);

            body.should.have.property('invitation').which.is.an.Object();
            const createdInvitation = body.invitation;
            checkCampaigns(campaign, createdInvitation.campaign);
            checkUsers(requester, createdInvitation.requester, {pryvToken: true});
            checkUsers(requestee, createdInvitation.requestee, {pryvToken: true});
            createdInvitation.status.should.be.eql(invitation.status);

            const dbInvitation = db.getInvitation({id: createdInvitation.id});
            should.exist(dbInvitation);
          });

      });

      it('should return an error with status 400 if the invitation already exists', () => {
        const requester = fixtures.addUser();
        const requestee = fixtures.addUser({pryvOnly: true});
        const campaign = fixtures.addCampaign({user: requester});

        let invitation = fixtures.addInvitation({
          campaign: campaign,
          requester: requester,
          requestee: requestee,
          status: 'accepted',
        });

        invitation = {
          status: 'accepted',
          campaign: _.pick(campaign, ['id']),
          requester: _.pick(requester, ['username']),
          requestee: _.pick(requestee, ['pryvUsername']),
        };

        return request(app)
          .post(makeUrl({username: requester.username}))
          .send(invitation)
          .then(res => {
            res.status.should.eql(400);
            should.exist(res.error);
          });
      })

    });

  });

  describe('when fetching invitations', () => {

    it('should return the user\'s invitations', () => {

      let user1, user2: User;
      let campaign1, campaign2: Campaign;
      let invitation1, invitation2, invitation3: Invitation;

      user1 = fixtures.addUser();
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
        .get(makeUrl({username: user1.username}))
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
        .get(makeUrl({username: 'unexistantUser'}))
        .expect(400)
        .then(res => {
          res.body.should.have.property('error');
        });
    });

  });

  describe('when updating invitations',  () => {

    it ('should return a 200 when the invitation is updated from created to accepted', () => {
      const invitation = fixtures.addInvitation({ status: 'created'});

      return request(app)
        .put('/' + invitation.requester.username + '/invitations/' + invitation.id)
        .send({
          status: 'accepted'
        })
        .then(res => {
          res.body.should.have.property('invitation');
          const updatedInvitation = res.body.invitation;
          invitation.status = 'accepted';
          checkInvitations(invitation, updatedInvitation, {
            modified: true
          });
          res.status.should.eql(200);
        })
    });

    it('should return a 200 when the invitation is updated from created to refused', () => {
      const invitation = fixtures.addInvitation({ status: 'created'});

      return request(app)
        .put('/' + invitation.requester.username + '/invitations/' + invitation.id)
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

    it('should return a 404 if the invitation does not exist', () => {

      const user = fixtures.addUser();

      return request(app)
        .put('/' + user.username + '/invitations/unexistant-id')
        .send({})
        .then(res => {
          res.status.should.eql(404);
          res.body.should.have.property('error');
        });
    });

  });

});
