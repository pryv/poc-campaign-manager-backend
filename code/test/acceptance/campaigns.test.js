// @flow

/* global describe, it, after, beforeEach */

const request: any = require('supertest');
const _: mixed = require('lodash');

const app: express$Application = require('../../src/app');
const config = require('../../src/config');
const getInstance = require('../../src/database').getInstance;

import {Fixtures} from '../support/Fixtures';
import {DbCleaner} from '../support/DbCleaner';
import type { Database } from '../../src/database';
import {User, Campaign} from '../../src/business';

import {checkCampaigns} from '../support/validation';

describe('campaigns', () => {

  let fixtures: Fixtures = new Fixtures();
  let db: Database = getInstance();
  let cleaner: DbCleaner = new DbCleaner();

  beforeEach(() => {
    return cleaner.clean();
  });

  function makeUrl(): string {
    return '/campaigns';
  }

  describe('when creating a campaign', () => {

    it('should create the campaign, return 201 with the created campaign when the user exists and all required fields are met', () => {

      const user: User = fixtures.addUser();
      const access: Access = fixtures.addAccess({user: user});
      const campaign = fixtures.getCampaign({user: user});

      const payload: any = {
        campaign: _.pick(campaign, ['title', 'description', 'permissions']),
        user: _.pick(user, ['username']),
      };

      return request(app)
        .post(makeUrl())
        .set('authorization', access.id)
        .send(payload)
        .then(res => {
          res.status.should.eql(201);

          res.body.should.have.property('campaign').which.is.an.Object();

          const createdCampaign: Campaign = new Campaign(res.body.campaign);
          checkCampaigns(campaign, createdCampaign, {id: true});

          const localCampaign: Campaign = db.campaigns.getOne({user: user, campaignId: createdCampaign.id});
          checkCampaigns(createdCampaign, localCampaign);
        });
    });

    it('should return a 400 response with an error message when the user does not exist', () => {

      return request(app)
        .post(makeUrl())
        .send({
          user: {username: 'unexistant-user'}
        })
        .then(res => {
          res.status.should.eql(400);
          res.body.should.have.property('error');
        });
    });



    it('should return a 400 response with an error message when the campaign schema is wrong', () => {

      const user: User = fixtures.addUser();
      const access: Access = fixtures.addAccess({user: user});
      const incompleteCampaign = {
        user: {username: user.username},
        campaign: {
          id: 'blop',
          title: 'blip'
        }
      };

      return request(app)
        .post(makeUrl())
        .set('authorization', access.id)
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
      const access: Access = fixtures.addAccess({user: user});
      let campaign: Campaign = fixtures.addCampaign({user: user});

      return request(app)
        .get(makeUrl())
        .set('authorization', access.id)
        .query({username: user.username})
        .then(res => {
          res.status.should.eql(200);
          res.body.should.have.property('campaigns').which.is.a.Array();
          const firstCampaign = res.body.campaigns[0];

          campaign.should.be.eql(new Campaign(firstCampaign));
        });

    });

    it('should return a 400 response with an error message when the user does not exist', () => {

      return request(app)
        .get(makeUrl())
        .query({username: 'unexistant-user'})
        .then(res => {
          res.status.should.eql(400);
          res.body.should.have.property('error');
        });
    });

  });

  describe('when querying a campaign', () => {

    function makeUrl(params: {
      campaignId: string
    }): string {
      return '/campaigns/' + params.campaignId;
    }

    it('should return the campaign', () => {

      const user: User = fixtures.addUser();
      const campaign: Campaign = fixtures.addCampaign({user: user});
      campaign.requester = user.username;

      return request(app)
        .get(makeUrl({campaignId: campaign.id}))
        .then(res => {
          res.status.should.eql(200);
          res.body.should.have.property('campaign');
          const retrievedCampaign = res.body.campaign;
          checkCampaigns(campaign, retrievedCampaign);
        });
    });

    it('should return an error if the campaign does not exist', () => {

      return request(app)
        .get(makeUrl({campaignId: 'nonexistantId'}))
        .then(res => {
          res.status.should.eql(400);
          res.body.should.have.property('error');
        });
    });

    describe('by Pryv App Id', () => {

      function makeUrl(params: {
        pryvAppId: string
      }): string {
        return '/campaigns/by-pryv-app-id/' + params.pryvAppId;
      }

      it('should return the campaign', () => {

        const user: User = fixtures.addUser();
        const campaign: Campaign = fixtures.addCampaign({user: user});
        campaign.requester = user.username;

        return request(app)
          .get(makeUrl({pryvAppId: campaign.pryvAppId}))
          .then(res => {
            res.status.should.eql(200);
            res.body.should.have.property('campaign');
            const retrievedCampaign = res.body.campaign;
            checkCampaigns(campaign, retrievedCampaign);
          });
      });

      it('should return an error if the campaign does not exist', () => {

        return request(app)
          .get(makeUrl({pryvAppId: 'nonexistantId'}))
          .then(res => {
            res.status.should.eql(400);
            res.body.should.have.property('error');
          });
      });

    });

  });

  describe('when cancelling a campaign', () => {

    it('should return a 200, mark all related invitations as \'cancelled\' if the campaign exists and is valid', () => {

    });

    it('should return a 400 if the campaign is already cancelled', () => {

    });

    it('should return a 404 if the campaign does not exist', () => {

    });

  });

});