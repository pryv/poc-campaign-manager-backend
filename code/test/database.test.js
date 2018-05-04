// @flow

/* global describe, it, before, after*/

import fs from 'fs';
import {Database} from '../src/database';
import {User, Campaign} from '../src/business';
import {Fixtures} from './support/Fixtures';

const config = require('../src/config');

describe('Database', () => {

  const fixtures: Fixtures = new Fixtures();
  const db: Database = new Database({path: config.get('database:path')});

  before(() => {
    const user1 = fixtures.addUser();
    const user2 = fixtures.addUser();
    const user3 = fixtures.addUser();
    fixtures.addCampaign({user: user1});
    fixtures.addCampaign({user: user2});
    fixtures.addCampaign({user: user3});
  });

  after(() => {
    fixtures.close();
    fs.unlinkSync(config.get('database:path'));
  });

  describe('Users', () => {

    it('should create a user', () => {
      const user: User = fixtures.addUser();
      let users = db.getUsers();
      users.should.be.Array();

      let found = null;

      users.forEach((u) => {
        if (u.username === user.username) {
          found = u;
        }
      });
      found.should.not.be.null();
      found.username.should.be.eql(user.username);
      found.should.have.property('id');
    })
  });

  describe('Campaigns', () => {

    it('should create a campaign', () => {
      const user: User = fixtures.addUser();

      const campaign: Campaign = fixtures.addCampaign({user: user});

      let campaigns = db.getCampaigns({user: user});
      campaigns.should.be.Array();
      campaigns[0].title.should.be.eql(campaign.title);
      campaigns[0].pryvAppId.should.be.eql(campaign.pryvAppId);
      campaigns[0].created.should.be.eql(campaign.created);
      campaigns[0].description.should.be.eql(campaign.description);
      JSON.stringify(campaigns[0].permissions).should.be.eql(JSON.stringify(campaign.permissions));
      campaigns[0].should.have.property('id');
    })
  })
});