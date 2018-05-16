// @flow

/* global describe, it, before, after*/

import should from 'should';
import fs from 'fs';
import {Database} from '../src/database';
import {User, Campaign, Invitation} from '../src/business';
import {Fixtures} from './support/Fixtures';

const config = require('../src/config');

describe('Database', () => {

  let fixtures: Fixtures;
  let db: Database;

  let user1, user2, user3;
  let campaign1, campaign2, campaign3;

  before(() => {
    fixtures = new Fixtures();
    db = new Database({path: config.get('database:path')});

    user1 = fixtures.addUser();
    user2 = fixtures.addUser();
    user3 = fixtures.addUser();
    campaign1 = fixtures.addCampaign({user: user1});
    campaign2 = fixtures.addCampaign({user: user2});
    campaign3 = fixtures.addCampaign({user: user3});
  });

  after(() => {
    fixtures.close();
    fs.unlinkSync(config.get('database:path'));
  });

  describe('Invitations', () => {

    it('should create an invitation', () => {

      const invitation: Invitation = fixtures.addInvitation({
        campaign: campaign1,
        requester: user1,
        requestee: user2
      });

      const invitations = db.getInvitations({
        user: user1
      });

      let createdInvitation = null;
      invitations.forEach((i) => {
        if (i.id === invitation.id) {
          createdInvitation = i;
        }
      });
      should.exist(createdInvitation);

      invitation.id.should.eql(createdInvitation.id);
      invitation.campaignId.should.eql(createdInvitation.campaignId);
      invitation.requesterId.should.eql(createdInvitation.requesterId);
      invitation.requesteeId.should.eql(createdInvitation.requesteeId);
      invitation.created.should.eql(createdInvitation.created);
      invitation.modified.should.eql(createdInvitation.modified);
      invitation.status.should.eql(createdInvitation.status);
      invitation.accessToken.should.eql(createdInvitation.accessToken);
    });

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
      found.pryvUsername.should.be.eql(user.pryvUsername);
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
    });
  })
});