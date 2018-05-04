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
      })

    });

  });

});