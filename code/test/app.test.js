// @flow

/* global describe, it, before, after */

const request: any = require('supertest');
const should: any = require('should');

import fs from 'fs';

const app: express$Application = require('../src/app');
const config = require('../src/config');

import {Fixtures} from './support/Fixtures';
import {Database} from '../src/database';
import {Campaign} from '../src/business';

const DB_PATH = config.get('database:path');

describe('app', () => {

  let fixtures: Fixtures;
  let db: Database;

  let user;
  let campaign;

  before(() => {
    fixtures = new Fixtures();
    db = new Database({path: DB_PATH});

    user = fixtures.addUser();
    campaign = fixtures.addCampaign({user: user});
  });

  after(() => {
    fixtures.close();
    fs.unlinkSync(DB_PATH);
  });

  describe('campaigns', () => {

    describe('when creating a campaign', () => {

      before(() => {
        user = fixtures.addUser();
      });

      it('should create the campaign, return 201 with the created campaign when the user exists and all required fields are met', () => {

        const campaign = fixtures.getCampaign({user: user});

        return request(app)
          .post('/' + user.username + '/campaigns')
          .send(campaign)
          .expect(201)
          .then(res => {
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

      it('should return a 404 response with an error message when the user does not exist', () => {

        return request(app)
          .post('/unexistant-user/campaigns')
          .send({})
          .expect(404)
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
          .post('/' + user.username + '/campaigns')
          .send(incompleteCampaign)
          .expect(400)
          .then(res => {
            res.body.should.have.property('error');
          });
      });

    });

    describe('when querying campaigns', () => {

      before(() => {
        user = fixtures.addUser();
        campaign = fixtures.addCampaign({user: user});
      });

      it('should return the user\'s list of campaigns when the user exists', () => {

        return request(app)
          .get('/' + user.username + '/campaigns')
          .expect(200)
          .then(res => {
            res.body.should.have.property('campaigns').which.is.a.Array();
            const firstCampaign = res.body.campaigns[0];

            campaign.should.be.eql(new Campaign(firstCampaign));
          });

      });

      it('should return a 404 response with an error message when the user does not exist', () => {

        return request(app)
          .get('/unexistant-user/campaigns')
          .expect(404)
          .then(res => {
            res.body.should.have.property('error');
          })
      });

    });

  });

});