// @flow

/* global describe, it, before, after */

const request: any = require('supertest');
const should: any = require('should');
const _: mixed = require('lodash');
const sha256: any = require('fast-sha256');
const nacl: any = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const app: express$Application = require('../../src/app');
const config = require('../../src/config');

import {Fixtures} from '../support/Fixtures';
import {DbCleaner} from '../support/DbCleaner';
import {Database} from '../../src/database';
import {User, Campaign, Invitation} from '../../src/business';

import {checkCampaigns} from '../support/validation';

const DB_PATH = config.get('database:path');

describe('campaigns', () => {

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
    return '/' + params.username + '/campaigns';
  }

  describe('when creating a campaign', () => {

    it('should create the campaign, return 201 with the created campaign when the user exists and all required fields are met', () => {

      const user: User = fixtures.addUser();
      const campaign = fixtures.getCampaign({user: user});

      return request(app)
        .post(makeUrl({username: user.username}))
        .send(_.pick(campaign, ['title', 'description', 'permissions']))
        .then(res => {
          res.status.should.eql(201);
          res.body.should.have.property('campaign').which.is.an.Object();

          const createdCampaign: Campaign = new Campaign(res.body.campaign);
          checkCampaigns(campaign, createdCampaign, {id: true});

          const localCampaign: Campaign = db.getCampaign({user: user, campaignId: createdCampaign.id});
          checkCampaigns(createdCampaign, localCampaign);
        });
    });

    it('should return a 400 response with an error message when the user does not exist', () => {

      return request(app)
        .post(makeUrl({username: 'unexistant-user'}))
        .send({})
        .then(res => {
          res.status.should.eql(400);
          res.body.should.have.property('error');
        });
    });



    it('should return a 400 response with an error message when the campaign schema is wrong', () => {

      const user: User = fixtures.addUser();
      const incompleteCampaign = {
        id: 'blop',
        title: 'blip'
      };

      return request(app)
        .post(makeUrl({username: user.username}))
        .send(incompleteCampaign)
        .then(res => {
          res.status.should.eql(400);
          res.body.should.have.property('error');
        });
    });

  });

  describe('when querying campaigns', () => {

    it('should return the user\'s list of campaigns when the user exists', () => {

      let user: User = fixtures.addUser();
      let campaign: Campaign = fixtures.addCampaign({user: user});

      return request(app)
        .get(makeUrl({username: user.username}))
        .then(res => {
          res.status.should.eql(200);
          res.body.should.have.property('campaigns').which.is.a.Array();
          const firstCampaign = res.body.campaigns[0];

          campaign.should.be.eql(new Campaign(firstCampaign));
        });

    });

    it('should return a 400 response with an error message when the user does not exist', () => {

      return request(app)
        .get(makeUrl({username: 'unexistant-user'}))
        .then(res => {
          res.status.should.eql(400);
          res.body.should.have.property('error');
        })
    });

  });

  describe('when querying a campaign', () => {

    function makeUrl(params: {
      username: string,
      campaignId: string
    }): string {
      return '/' + params.username + '/campaigns/' + params.campaignId;
    }

    describe('as an authentified user', () => {

      it('should return the campaign', () => {

        const user: User = fixtures.addUser();
        const campaign: Campaign = fixtures.addCampaign({user: user});

        return request(app)
          .get(makeUrl({username: user.username, campaignId: campaign.id}))
          .then(res => {
            res.status.should.eql(200);
            res.body.should.have.property('campaign');
            const retrievedCampaign = res.body.campaign;
            new Campaign(retrievedCampaign).should.be.eql(campaign);
          });
      });

      it('should return an error if the user does not exist', () => {

        return request(app)
          .get(makeUrl({username: 'nonexistantUser'}))
          .then(res => {
            res.status.should.eql(400);
            res.body.should.have.property('error');
          });
      });

      it('should return an error if the campaign does not exist', () => {

        const user: User = fixtures.addUser();

        return request(app)
          .get(makeUrl({username: user.username, campaignId: 'nonexistantId'}))
          .then(res => {
            res.status.should.eql(400);
            res.body.should.have.property('error');
          });
      });

    });

    describe('as a patient', () => {

      let user: User;
      let campaign: Campaign;
      let invitation: Invitation;

      before(() => {

      });

      it('should return the campaign if the token is correct', () => {

        user = fixtures.addUser({pryvOnly: true});
        campaign = fixtures.addCampaign();
        invitation = fixtures.addInvitation({
          campaign: campaign,
          requestee: user,
        });
        const msg: number = Date.now() / 1000;
        const encodedToken: Uint8Array = nacl.util.decodeUTF8(invitation.accessToken);
        const encodedTimestamp: Uint8Array = nacl.util.decodeUTF8(msg + '');
        const hmaced: Array<any> = sha256.hmac(encodedToken, encodedTimestamp);

        return request(app)
          .get('/all/campaigns/title/' + campaign.pryvAppId)
          .query('message=' + msg)
          .query('signature=' + hmaced)
          .query('pryvUsername=' + user.pryvUsername)
          .then(res => {
            res.status.should.eql(200);
            res.body.should.have.property('campaign').which.is.an.Object();
            const retrievedCampaign: Campaign = res.body.campaign;
            checkCampaigns(campaign, retrievedCampaign);
          });

      });

      it('should return an error if the campaign has no invitation for the user', () => {

        user = fixtures.addUser({pryvOnly: true});
        campaign = fixtures.addCampaign();

        const msg: number = Date.now() / 1000;

        return request(app)
          .get('/all/campaigns/title/' + campaign.pryvAppId)
          .query('message=' + msg)
          .query('signature=' + 'irrelevant')
          .query('pryvUsername=' + user.pryvUsername)
          .then(res => {
            res.status.should.eql(400);
            res.body.should.have.property('error').which.is.a.String();
          });

      });

      it('should return an error if the campaign does not exist', () => {

        user = fixtures.addUser({pryvOnly: true});

        return request(app)
          .get('/all/campaigns/title/' + campaign.pryvAppId)
          .query('message=' + 'irrelevant')
          .query('signature=' + 'irrelevant')
          .query('pryvUsername=' + user.pryvUsername)
          .then(res => {
            res.status.should.eql(400);
            res.body.should.have.property('error').which.is.a.String();
          });
      });

      it('should return an error if the token is invalid', () => {

        user = fixtures.addUser({pryvOnly: true});
        campaign = fixtures.addCampaign();
        invitation = fixtures.addInvitation({
          campaign: campaign,
          requestee: user,
        });
        const msg: number = Date.now() / 1000;
        const encodedToken: Uint8Array = nacl.util.decodeUTF8('something-else');
        const encodedTimestamp: Uint8Array = nacl.util.decodeUTF8(msg + '');
        const hmaced: Array<any> = sha256.hmac(encodedToken, encodedTimestamp);

        return request(app)
          .get('/all/campaigns/title/' + campaign.pryvAppId)
          .query('message=' + msg)
          .query('signature=' + hmaced)
          .query('pryvUsername=' + user.pryvUsername)
          .then(res => {
            res.status.should.eql(400);
            res.body.should.have.property('error').which.is.a.String();
          });
      });

      it('should return an error if the timestamp is too old', () => {

        user = fixtures.addUser({pryvOnly: true});
        campaign = fixtures.addCampaign();
        invitation = fixtures.addInvitation({
          campaign: campaign,
          requestee: user,
        });
        const msg: number = (Date.now() / 1000) - 100;
        const encodedToken: Uint8Array = nacl.util.decodeUTF8(invitation.accessToken);
        const encodedTimestamp: Uint8Array = nacl.util.decodeUTF8(msg + '');
        const hmaced: Array<any> = sha256.hmac(encodedToken, encodedTimestamp);

        return request(app)
          .get('/all/campaigns/title/' + campaign.pryvAppId)
          .query('message=' + msg)
          .query('signature=' + hmaced)
          .query('pryvUsername=' + user.pryvUsername)
          .then(res => {
            res.status.should.eql(400);
            res.body.should.have.property('error').which.is.a.String();
          });

      });

      it('should return an error if the timestamp is too far into the future', () => {

        user = fixtures.addUser({pryvOnly: true});
        campaign = fixtures.addCampaign();
        invitation = fixtures.addInvitation({
          campaign: campaign,
          requestee: user,
        });
        const msg: number = (Date.now() / 1000) + 100;
        const encodedToken: Uint8Array = nacl.util.decodeUTF8(invitation.accessToken);
        const encodedTimestamp: Uint8Array = nacl.util.decodeUTF8(msg + '');
        const hmaced: Array<any> = sha256.hmac(encodedToken, encodedTimestamp);

        return request(app)
          .get('/all/campaigns/title/' + campaign.pryvAppId)
          .query('message=' + msg)
          .query('signature=' + hmaced)
          .query('pryvUsername=' + user.pryvUsername)
          .then(res => {
            res.status.should.eql(400);
            res.body.should.have.property('error').which.is.a.String();
          });

      });

    });

  });

});