// @flow

/* global describe, it, before, after */

const request: any = require('supertest');
const should: any = require('should');

import fs from 'fs';

const app: express$Application = require('../src/app');
const config = require('../src/config');

import {Fixtures} from './support/Fixtures';
import {Database} from '../src/database';
import {Campaign, User, Invitation} from '../src/business';

const DB_PATH = config.get('database:path');

describe('app', () => {

  let fixtures: Fixtures;
  let db: Database;

  let user1;
  let campaign;

  before(() => {
    fixtures = new Fixtures();
    db = new Database({path: DB_PATH});

    user1 = fixtures.addUser();
    campaign = fixtures.addCampaign({user: user1});
  });

  after(() => {
    fixtures.close();
    fs.unlinkSync(DB_PATH);
  });

  describe('invitations', () => {

    let user1: User, user2: User;
    let campaign1: Campaign;

    before(() => {
      user1 = fixtures.addUser();
      user2 = fixtures.addUser();
      campaign1 = fixtures.addCampaign({user: user1});
    });

    function makeUrl(params: {
      username: string
    }): string {
        return '/' + params.username + '/invitations';
    }

    describe('when creating an invitation', () => {

      it('should create the invitation in the database, return a 201 with the created invitation', () => {

        const invitation = fixtures.getInvitation({
          campaign: campaign1,
          requester: user1,
          requestee: user2
        });

        return request(app)
          .post(makeUrl({username: user1.username}))
          .send(invitation)
          .expect(201)
          .then(res => {
            res.body.should.have.property('invitation').which.is.an.Object();
            new Invitation(res.body.invitation).should.be.eql(invitation);

            const invitations = db.getInvitations({requester: user1});
            let found = null;
            invitations.forEach((i) => {
              if (i.id === invitation.id) {
                found = i;
              }
            });
            should.exist(found);
            found.should.eql(invitation);
          });
      });

      it('should return a 400 when the requester does not exist', () => {
        const unexistantUser = {
          id: 'idontexist',
          username: 'idontexist'
        };
        const campaign = fixtures.getCampaign({user: unexistantUser});

        const invitation = fixtures.getInvitation({
          campaign: campaign,
          requester: unexistantUser
        });

        return request(app)
          .post(makeUrl({username: unexistantUser.username}))
          .send(invitation)
          .expect(400)
          .then(res => {
            res.body.should.have.property('error');
          });
      });

      it('should return a 400 when the campaign does not exist', () => {
        const unexistantCampaign = fixtures.getCampaign({user: user1});

        const invitation = fixtures.getInvitation({
          requester: user1,
          campaign: unexistantCampaign
        });

        return request(app)
          .post(makeUrl({username: user1.username}))
          .send(invitation)
          .expect(400)
          .then(res => {
            res.body.should.have.property('error');
          });
      });

      it('should return a 400 when the invitation schema is not respected', () => {
        const invitation = fixtures.getInvitation({
          requester: user1,
          requestee: user2,
          campaign: campaign1
        });

        delete invitation.campaignId;

        return request(app)
          .post(makeUrl({username: user1.username}))
          .send(invitation)
          .expect(400)
          .then(res => {
            res.body.should.have.property('error');
          });
      });

    });

      describe('when fetching invitations', () => {

        let user1: User;
        let campaign1: Campaign;
        let invitation1, invitation2: Invitation;

        before(() => {
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
        });

        it('should return the user\'s invitations', () => {

          return request(app)
            .get(makeUrl({username: user1.username}))
            .expect(200)
            .then(res => {
              res.body.should.have.property('invitations');
              let found1, found2;
              let invitations = res.body.invitations;
              invitations.forEach((i) => {
                if (i.id === invitation1.id) {
                  found1 = i;
                }
                if (i.id === invitation2.id) {
                  found2 = i;
                }
              });
              should.exist(found1);
              should.exist(found2);
              new Invitation(found1).should.be.eql(invitation1);
              new Invitation(found2).should.be.eql(invitation2);
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

  });

  describe('campaigns', () => {

    function makeUrl(params: {
      username: string
    }): string {
      return '/' + params.username + '/campaigns';
    }

    describe('when creating a campaign', () => {

      let user1;

      before(() => {
        user1 = fixtures.addUser();
      });

      it('should create the campaign, return 201 with the created campaign when the user exists and all required fields are met', () => {

        const campaign = fixtures.getCampaign({user: user1});

        return request(app)
          .post(makeUrl({username: user1.username}))
          .send(campaign)
          .expect(201)
          .then(res => {
            res.body.should.have.property('campaign').which.is.an.Object();
            new Campaign(res.body.campaign).should.be.eql(campaign);

            const userCampaigns = db.getCampaigns({user: user1});
            let found = null;
            userCampaigns.forEach((c) => {
              if (c.id === campaign.id) {
                found = c;
              }
            });
            found.should.not.be.null();
            campaign.should.be.eql(found);
          });
      });

      it('should return a 400 response with an error message when the user does not exist', () => {

        return request(app)
          .post(makeUrl({username: 'unexistant-user'}))
          .send({})
          .expect(400)
          .then(res => {
            res.body.should.have.property('error');
          });
      });

      it('should return a 400 response with an error message when the campaign schema is wrong', () => {

        const incompleteCampaign = {
          id: 'blop',
          title: 'blip'
        };

        return request(app)
          .post(makeUrl({username: user1.username}))
          .send(incompleteCampaign)
          .expect(400)
          .then(res => {
            res.body.should.have.property('error');
          });
      });

    });

    describe('when querying campaigns', () => {

      before(() => {
        user1 = fixtures.addUser();
        campaign = fixtures.addCampaign({user: user1});
      });

      it('should return the user\'s list of campaigns when the user exists', () => {

        return request(app)
          .get(makeUrl({username: user1.username}))
          .expect(200)
          .then(res => {
            res.body.should.have.property('campaigns').which.is.a.Array();
            const firstCampaign = res.body.campaigns[0];

            campaign.should.be.eql(new Campaign(firstCampaign));
          });

      });

      it('should return a 400 response with an error message when the user does not exist', () => {

        return request(app)
          .get(makeUrl({username: 'unexistant-user'}))
          .expect(400)
          .then(res => {
            res.body.should.have.property('error');
          })
      });

    });

    describe('wen querying a campaign', () => {

      function makeUrl(params: {
        username: string,
        campaignId: string
      }): string {
          return '/' + params.username + '/campaigns/' + params.campaignId;
      }

      let user: User;
      let campaign: Campaign;
      let invitation: Invitation;

      before(() => {
        user = fixtures.addUser();
        campaign = fixtures.addCampaign({user: user});
        invitation = fixtures.addInvitation({
          campaign: campaign,
          requester: user
        });
      });

      it('should return the campaign', () => {

        return request(app)
          .get(makeUrl({username: user.username, campaignId: campaign.id}))
          .expect(200)
          .then(res => {
            res.body.should.have.property('campaign');
            const retrievedCampaign = res.body.campaign;
            new Campaign(retrievedCampaign).should.be.eql(campaign);
          });
      });

      it('should return an error if the user does not exsit', () => {

        return request(app)
          .get(makeUrl({username: 'nonexistantUser'}))
          .expect(400)
          .then(res => {
            res.body.should.have.property('error');
          });
      });

      it('should return an error if the campaign does not exist', () => {

        return request(app)
          .get(makeUrl({username: user.username, campaignId: 'nonexistantId'}))
          .expect(400)
          .then(res => {
            res.body.should.have.property('error');
          });
      });
    });

  });

});