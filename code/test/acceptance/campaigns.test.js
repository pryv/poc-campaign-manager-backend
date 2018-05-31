// @flow

/* global describe, it, before, after */

const request: any = require('supertest');
const should: any = require('should');

const app: express$Application = require('../../src/app');
const config = require('../../src/config');

import {Fixtures} from '../support/Fixtures';
import {DbCleaner} from '../support/DbCleaner';
import {Database} from '../../src/database';
import {Campaign, User} from '../../src/business';

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
        .send(campaign)
        .then(res => {
          res.status.should.eql(201);
          res.body.should.have.property('campaign').which.is.an.Object();
          new Campaign(res.body.campaign).should.be.eql(campaign);

          const userCampaigns = db.getCampaigns({user: user});
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

  describe('wen querying a campaign', () => {

    function makeUrl(params: {
      username: string,
      campaignId: string
    }): string {
      return '/' + params.username + '/campaigns/' + params.campaignId;
    }

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

});