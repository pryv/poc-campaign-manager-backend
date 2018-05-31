// @flow

/* global describe, it, before, after*/

import should from 'should';
import {Database} from '../../src/database';
import {User, Campaign, Invitation} from '../../src/business';
import {Fixtures} from '../support/Fixtures';
import {DbCleaner} from '../support/DbCleaner';

const config = require('../../src/config');

describe('Database', () => {

  let fixtures: Fixtures = new Fixtures();
  let db: Database = new Database({path: config.get('database:path')});
  let cleaner: DbCleaner = new DbCleaner();

  beforeEach(() => {
    return cleaner.clean();
  });

  after(() => {
    fixtures.close();
    cleaner.close();
  });

  describe('Invitations', () => {

    it('should retrieve an invitation', () => {

      const invitation: Invitation = fixtures.addInvitation();
      const createdInvitation = db.getInvitation({id: invitation.id});
      should.exist(createdInvitation);
      invitation.campaign.should.eql(createdInvitation.campaign);
      invitation.created.should.eql(createdInvitation.created);
      invitation.modified.should.eql(createdInvitation.modified);
      invitation.status.should.eql(createdInvitation.status);
      invitation.accessToken.should.eql(createdInvitation.accessToken);

      invitation.requester.id.should.eql(createdInvitation.requester.id);
      invitation.requestee.id.should.eql(createdInvitation.requestee.id);
      invitation.requester.username.should.eql(createdInvitation.requester.username);
      invitation.requestee.username.should.eql(createdInvitation.requestee.username);
    });

    it('should update an invitation', () => {

      const invitation: Invitation = fixtures.addInvitation();
      invitation.status = 'accepted';
      invitation.modified = Date.now() / 1000;
      db.updateInvitation({
        invitation: invitation
      });
      const updatedInvitation = db.getInvitation({id: invitation.id});

      should.exist(updatedInvitation);
      invitation.campaign.should.eql(updatedInvitation.campaign);
      invitation.created.should.eql(updatedInvitation.created);
      invitation.modified.should.eql(updatedInvitation.modified);
      invitation.status.should.eql(updatedInvitation.status);
      invitation.accessToken.should.eql(updatedInvitation.accessToken);

      invitation.requester.id.should.eql(updatedInvitation.requester.id);
      invitation.requestee.id.should.eql(updatedInvitation.requestee.id);
      invitation.requester.username.should.eql(updatedInvitation.requester.username);
      invitation.requestee.username.should.eql(updatedInvitation.requestee.username);
    });

  });

  describe('Users', () => {

    it('should return if the user exists or not', () => {
      const createdUser: User = fixtures.addUser();
      createdUser.exists(db).should.eql(true);
      const notCreatedUser: User = fixtures.getUser();
      notCreatedUser.exists(db).should.eql(false);
    });

    it('should create an app user only if no pryv username is provided', () => {
      const user: User = fixtures.addUser({appOnly: true});
      const createdUser: User = db.getUser({username: user.username});
      should.exist(createdUser);
      createdUser.username.should.eql(user.username);
      should.exist(createdUser.id);
      should.not.exist(createdUser.pryvId);
      should.not.exist(createdUser.pryvUsername);
    });

    it('should create a Pryv user and an app user if username is not provided', () => {
      const pryvUser = fixtures.addUser({pryvOnly: true});
      const createdPryvUser = db.getUser({pryvUsername: pryvUser.pryvUsername});
      should.exist(createdPryvUser);
      createdPryvUser.pryvUsername.should.eql(pryvUser.pryvUsername);
      should.exist(createdPryvUser.id);
      should.exist(createdPryvUser.pryvId);
      should.not.exist(createdPryvUser.username);
    });

    it('should create an user and Pryv user if both usernames are provided', () => {
      const fullUser: User = fixtures.addUser({full: true});
      const createdUser: User = db.getUser({username: fullUser.username});
      createdUser.username.should.eql(fullUser.username);
      createdUser.id.should.eql(fullUser.id);
      createdUser.pryvId.should.eql(fullUser.pryvId);
      createdUser.pryvUsername.should.eql(fullUser.pryvUsername);
    });
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