// @flow

/* global describe, it, before, after*/

import should from 'should';
import {Database} from '../../src/database';
import {User, Campaign, Invitation} from '../../src/business';
import {Fixtures} from '../support/Fixtures';
import {checkInvitations, checkCampaigns, checkUsers} from '../support/validation';
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
  });

  describe('Mixed', () => {

  });

  describe('Invitations', () => {

    it('should retrieve an invitation', () => {

      const invitation: Invitation = fixtures.addInvitation();
      const createdInvitation = db.getInvitation({id: invitation.id});
      should.exist(createdInvitation);
      checkInvitations(invitation, createdInvitation);
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

    it('should return a local user when querying by username', () => {
      const user: User = fixtures.addUser({localOnly: true});
      const createdUser: User = db.getUser({username: user.username});
      should.exist(createdUser);
      checkUsers(user, createdUser);
    });

    it('should return a pryv user when querying by pryv username', () => {
      const pryvUser = fixtures.addUser({pryvOnly: true});
      const createdPryvUser = db.getUser({pryvUsername: pryvUser.pryvUsername});
      should.exist(createdPryvUser);
      checkUsers(pryvUser, createdPryvUser);
    });

    it('should return a pryv user when querying by pryv id', () => {
      const pryvUser = fixtures.addUser({pryvOnly: true});
      const createdPryvUser = db.getUser({pryv_id: pryvUser.pryvId});
      should.exist(createdPryvUser);
      checkUsers(pryvUser, createdPryvUser);
    });

    it('should return a full user when querying by username', () => {
      const user: User = fixtures.addUser();
      const createdUser: User = db.getUser({username: user.username});
      should.exist(createdUser);
      checkUsers(user, createdUser);
    });

    it('should return a full user when querying by pryv username', () => {
      const user: User = fixtures.addUser();
      const createdUser: User = db.getUser({pryvUsername: user.pryvUsername});
      should.exist(createdUser);
      checkUsers(user, createdUser);
    });

  });

  describe('Campaigns', () => {

    it('should create a campaign', () => {
      const user: User = fixtures.addUser();

      const campaign: Campaign = fixtures.addCampaign({user: user});

      let campaigns = db.getCampaigns({user: user});
      campaigns.should.be.Array();
      checkCampaigns(campaign, campaigns[0]);
    });
  })
});