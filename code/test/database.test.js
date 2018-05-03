// @flow

/* global describe, it, before, after*/

import fs from 'fs';
import should from 'should';
import {Database} from '../src/database';
import {User} from '../src/business/User';
import {Campaign} from '../src/business/Campaign';
import cuid from 'cuid';

const DB_PATH: string = 'test.db';

describe('Database', () => {

  const db: Database = new Database({path: DB_PATH});

  after(() => {
    db.close();
    fs.unlinkSync(DB_PATH);
  });

  describe('Users', () => {

    it('should create a user', () => {
      new User({
        username: 'bob'
      }).save(db);
      let users = db.getUsers();
      users.should.be.Array();
      users[0].username.should.be.eql('bob');
      users[0].should.have.property('id');
    })
  });

  describe('Campaigns', () => {

    it('should create a campaign', () => {
      const user: User = new User({
        username: 'waleed',
        id: cuid()
      });
      user.save(db);

      const campaign: Campaign = new Campaign({
        title: 'allergy exposition',
        username: user.username,
        pryvAppId: 'testing',
        created: Date.now() / 1000,
        description: 'The goal of this campaign is to review the allergy exposition of patients aged 18-52 in western Switzerland.',
        permissions: [
          {
            streamId: 'allergy',
            defaultName: 'Allergy',
            level: 'read'
          }
        ]
      });
      campaign.save({db: db, user: user});
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