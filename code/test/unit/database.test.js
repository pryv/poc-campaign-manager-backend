// @flow

/* global describe, it, beforeEach*/

const should = require('should');
import type { Database } from '../../src/database';
const {User, Campaign, Invitation, Access} = require('../../src/business');
const Fixtures = require('../support/Fixtures');
const {checkInvitations, checkCampaigns, checkUsers, checkAccesses} = require('../support/validation');
const DbCleaner = require('../support/DbCleaner');
const _ = require('lodash');

const getInstance = require('../../src/database').getInstance;

describe('Database', () => {

  const fixtures: Fixtures = new Fixtures();
  const db: Database = getInstance();
  const cleaner: DbCleaner = new DbCleaner();

  beforeEach(() => {
    return cleaner.clean();
  });

  describe('Invitations', () => {

    it('should retrieve an invitation', () => {

      const invitation: Invitation = fixtures.addInvitation();
      const createdInvitation = db.invitations.getOne({id: invitation.id});
      should.exist(createdInvitation);
      checkInvitations(invitation, createdInvitation);
    });

    it('should update an invitation, creating a version', () => {
      const invitation: Invitation = fixtures.addInvitation();
      const originalInvitation: Invitation = _.cloneDeep(invitation);

      invitation.status = 'accepted';
      invitation.modified = Date.now() / 1000;
      db.invitations.updateOne({
        invitation: invitation
      });
      const updatedInvitation: Invitation = db.invitations.getOne({id: invitation.id});

      should.exist(updatedInvitation);
      checkInvitations(invitation, updatedInvitation);

      const retrievedInvitations: Array<Invitation> = db.invitations.get({ user: invitation.requester});
      retrievedInvitations.length.should.eql(2);

      const original: Invitation = retrievedInvitations.filter((i) => { return i.headId !== null; })[0];
      checkInvitations(original, originalInvitation, { id: true });
      original.headId.should.eql(originalInvitation.id);

      const update: Invitation = retrievedInvitations.filter((i) => { return i.headId == null; })[0];
      checkInvitations(update, updatedInvitation);
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
      const createdUser: User = db.users.getOne({username: user.username});
      should.exist(createdUser);
      checkUsers(user, createdUser);
    });

    it('should return a pryv user when querying by pryv username', () => {
      const pryvUser = fixtures.addUser({pryvOnly: true});
      const createdPryvUser = db.users.getOne({pryvUsername: pryvUser.pryvUsername});
      should.exist(createdPryvUser);
      checkUsers(pryvUser, createdPryvUser);
    });

    it('should return a pryv user when querying by pryv id', () => {
      const pryvUser = fixtures.addUser({pryvOnly: true});
      const createdPryvUser = db.users.getOne({pryv_id: pryvUser.pryvId});
      should.exist(createdPryvUser);
      checkUsers(pryvUser, createdPryvUser);
    });

    it('should return a full user when querying by username', () => {
      const user: User = fixtures.addUser();
      const createdUser: User = db.users.getOne({username: user.username});
      should.exist(createdUser);
      checkUsers(user, createdUser);
    });

    it('should return a full user when querying by pryv username', () => {
      const user: User = fixtures.addUser();
      const createdUser: User = db.users.getOne({pryvUsername: user.pryvUsername});
      should.exist(createdUser);
      checkUsers(user, createdUser);
    });

    it('should associate a Pryv user to a local user', () => {
      const user: User = fixtures.addUser({localOnly: true});

      user.pryvUsername = 'testuser';
      user.pryvToken = 'doanwdoianw';
      user.pryvId = 'conawidnaowinda';
      db.users.addPryvAccountToUser({
        user: user
      });

      const linkedUser: User= db.users.getOne({pryvUsername: user.pryvUsername});

      // because db.getUser() does not return the pryvToken
      linkedUser.pryvToken = user.pryvToken;

      checkUsers(user, linkedUser);
    });

    it('should return a pryv token when it exists', () => {
      const user: User = fixtures.addUser({ linked: true });

      const pryvToken = db.users.getPryvToken({user: user});
      should.exist(pryvToken);
      pryvToken.should.eql(user.pryvToken);
    });

  });

  describe('Campaigns', () => {

    it('should create a campaign', () => {
      const user: User = fixtures.addUser();

      const campaign: Campaign = fixtures.addCampaign({user: user});

      let campaigns = db.campaigns.get({user: user});
      campaigns.should.be.Array();
      checkCampaigns(campaign, campaigns[0]);
    });

    it('should return a campaign with a requester when querying by campaign id', () => {
      const user: User = fixtures.addUser();
      const campaign: Campaign = fixtures.addCampaign({user: user});

      const retrievedCampaign: Campaign = db.campaigns.getOne({campaignId: campaign.id});
      checkCampaigns(campaign, retrievedCampaign);
      retrievedCampaign.requester.should.eql(user.username);
    });

    it('should return a campaign when querying by pryvAppId', () => {
      const campaign: Campaign = fixtures.addCampaign();

      const retrievedCampaign: Campaign = db.campaigns.getOneByPryvAppId({pryvAppId: campaign.pryvAppId});
      checkCampaigns(campaign, retrievedCampaign);
    });

    it('should cancel update the campaign status to "cancelled"', () => {
      const campaign: Campaign = fixtures.addCampaign();

      const cancelledCampaign: Campaign = db.campaigns.cancel({ campaign: campaign });
      campaign.status = 'cancelled';
      campaign.modified = cancelledCampaign.modified;
      checkCampaigns(campaign, cancelledCampaign);
    });
  });

  describe('Accesses', () => {

    it('should create and retrieve an access', () => {
      const user: User = fixtures.addUser();
      const access: Access = new Access();

      db.accesses.save({
        user: user,
        access: access
      });
      const retrievedAccess: Access = db.accesses.getOne({
        user: user,
        accessId: access.id,
      });
      checkAccesses(retrievedAccess, access);
    });

    it('should update an access', () => {
      const user: User = fixtures.addUser();
      const access: Access = new Access();

      access.save({
        db: db,
        user: user,
      });

      access.isValid = false;

      db.accesses.updateOne({
        user: user,
        access: access,
      });
      const retrievedAccess: Access = db.accesses.getOne({
        user: user,
        accessId: access.id,
      });
      checkAccesses(retrievedAccess, access);
    });

  });
});