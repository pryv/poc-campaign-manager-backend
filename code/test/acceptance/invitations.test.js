// @flow

/* global describe, it, before, after */

const request: any = require('supertest');
const should: any = require('should');
import _ from 'lodash';
const cuid = require('cuid');

const app: express$Application = require('../../src/app');
const config = require('../../src/config');

import {Fixtures} from '../support/Fixtures';
import {DbCleaner} from '../support/DbCleaner';
import {Database} from '../../src/database';
import {Campaign, User, Invitation, Access} from '../../src/business';

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


  function makeUrl(): string {
    return '/invitations';
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

      const payload: mixed = {
        campaign: _.pick(campaign, ['id']),
        requester: _.pick(requester, ['username'])
      };

      return request(app)
        .post(makeUrl())
        .send(payload)
        .expect(400)
        .then(res => {
          res.body.should.have.property('error');
        });
    });

    it.skip('should return a 400 with an error message when the requestee is the requester', () => {
      const requester: User = fixtures.addUser();
      const access: Access = fixtures.addAccess({user: requester});
      const campaign: Campaign = fixtures.addCampaign({user: requester});

      const invitation: Invitation = fixtures.getInvitation({
        campaign: campaign,
        requester: requester,
        requestee: requester,
      });

      const payload: mixed = {
        campaign: _.pick(campaign, ['id']),
        requester: _.pick(requester, ['username']),
        requestee: _.pick(requestee, ['username']),
      };

      return request(app)
        .post(makeUrl())
        .set('authorization', access.id)
        .send(payload)
        .then(res => {
          res.status.should.eql(400);
          res.body.should.have.property('error');
        });
    });

    it('should return a 400 when the campaign does not exist', () => {

      const requester: User = fixtures.addUser();
      const access: Access = fixtures.addAccess({user: requester});

      const requestee: User = fixtures.addUser();
      const unexistantCampaign: Campaign = fixtures.getCampaign({user: requester});

      const payload: mixed = {
        campaign: _.pick(unexistantCampaign, ['id']),
        requestee: _.pick(requestee, ['username']),
      };

      return request(app)
        .post(makeUrl())
        //.set('authorization', access.id)
        .send(payload)
        .expect(400)
        .then(res => {
          res.body.should.have.property('error');
        });
    });

    it('should return a 400 when the invitation schema is not respected', () => {

      //const requester: User = fixtures.addUser();
      //const access: Access = fixtures.addAccess({user: requester});

      const payload: mixed = {
        invalidKey: 'blopblopblop',
        campaign: { id: 'doesnotmatter' },
        requestee: { username: 'doesNotMatter' },
      };

      return request(app)
        .post(makeUrl())
        //.set('authorization', access.id)
        .send(payload)
        .expect(400)
        .then(res => {
          res.body.should.have.property('error');
        });
    });

    describe('following a targeted invitation', () => {

      it('should create the invitation in the database, return the created invitation with status 201', () => {
        const requester = fixtures.addUser({localOnly: true});
        const access: Access = fixtures.addAccess({user: requester});
        const requestee: User = fixtures.addUser({pryvOnly: true});
        const campaign: Campaign = fixtures.addCampaign({user: requester});

        const payload: mixed = {
          campaign: _.pick(campaign, ['id']),
          requester: _.pick(requester, ['username']),
          requestee: _.pick(requestee, ['pryvUsername']),
        };

        return request(app)
          .post(makeUrl())
          //.set('authorization', access.id)
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

            const requesteeInvitations = db.invitations.get({user: requestee});
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
        const requester: User = fixtures.addUser();
        const access: Access = fixtures.addAccess({user: requester});
        const requestee: mixed = {
          pryvUsername: 'idontexist'
        };

        const campaign: Campaign = fixtures.addCampaign({user: requester});

        const payload = {
          campaign: _.pick(campaign, ['id']),
          requestee: requestee
        };

        return request(app)
          .post(makeUrl())
          .set('authorization', access.id)
          .send(payload)
          .expect(400)
          .then(res => {
            res.body.should.have.property('error');
          });
      });

      it('should return an error with status 400 if the invitation already exists', () => {
        const requester = fixtures.addUser();
        const access: Access = fixtures.addAccess({user: requester});
        const requestee = fixtures.addUser({pryvOnly: true});
        const campaign = fixtures.addCampaign({user: requester});
        const invitation = fixtures.addInvitation({
          campaign: campaign,
          requester: requester,
          requestee: requestee
        });

        return request(app)
          .post(makeUrl({username: requester.username}))
          .set('authorization', access.id)
          .send(invitation)
          .expect(400)
          .then(res => {
            res.body.should.have.property('error');
          });
      });

    });

    describe('following an anonymous invitation', () => {

      it('should create create the invitation in the database, return the created invitation with status 201', async () => {
        const requester: User = fixtures.addUser();
        const requestee: User = new User({
          pryvUsername: 'testuser.pryv.li'
        });
        requestee.save(db);
        const pryvToken: string = 'cjj8jxy0100020c0cw28xefx6';
        const campaign: Campaign = fixtures.addCampaign({user: requester});

        const invitation = {
          status: 'accepted',
          accessToken: pryvToken,
          campaign: _.pick(campaign, ['id']),
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
            checkUsers(requester, createdInvitation.requester);
            checkUsers(requestee, createdInvitation.requestee, {id: true});
            createdInvitation.status.should.be.eql(invitation.status);

            const dbInvitation = db.invitations.getOne({id: createdInvitation.id});
            should.exist(dbInvitation);
          });

      });

      it('should return an error with status 400 if the provided token is invalid', () => {
        const requester: User = fixtures.addUser();
        const requestee: User = new User({
          pryvUsername: 'testuser.pryv.li'
        });
        requestee.save(db);
        const invalidToken = 'invalidtoken';
        const campaign: Campaign = fixtures.addCampaign({user: requester});

        const invitation = {
          status: 'accepted',
          accessToken: invalidToken,
          campaign: _.pick(campaign, ['id']),
          requester: _.pick(requester, ['username']),
          requestee: _.pick(requestee, ['pryvUsername']),
        };

        return request(app)
          .post(makeUrl({username: requester.username}))
          .send(invitation)
          .then(res => {
            res.status.should.eql(400);
            should.exist(res.body.error);
          });
      });

      it('should return an error with status 400 if the invitation already exists', () => {
        const requester = fixtures.addUser();
        const access: Access = fixtures.addAccess({user: requester});
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
          .set('authorization', access.id)
          .send(invitation)
          .then(res => {
            res.status.should.eql(400);
            should.exist(res.error);
          });
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

  describe('when updating invitations',  () => {

    it ('should return a 200 when the invitation is updated from created to accepted', () => {
      const pryvToken: string = 'cjj8jxy0100020c0cw28xefx6';
      const requestee: User = new User({
        pryvUsername: 'testuser.pryv.li'
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
        })
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
          pryvUsername: 'testuser.pryv.li'
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
        })
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
