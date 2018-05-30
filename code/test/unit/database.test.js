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

    it('should create an invitation', () => {

      const invitation: Invitation = fixtures.addInvitation();

      const invitations = db.getInvitations({
        user: invitation.requester
      });

      let createdInvitation = null;
      invitations.forEach((i) => {
        if (i.id === invitation.id) {
          createdInvitation = i;
        }
      });
      should.exist(createdInvitation);

      invitation.id.should.eql(createdInvitation.id);
      invitation.campaign.should.eql(createdInvitation.campaign);
      invitation.requester.should.eql(createdInvitation.requester);
      invitation.requestee.should.eql(createdInvitation.requestee);
      invitation.created.should.eql(createdInvitation.created);
      invitation.modified.should.eql(createdInvitation.modified);
      invitation.status.should.eql(createdInvitation.status);
      invitation.accessToken.should.eql(createdInvitation.accessToken);
    });

    it('should retrieve an invitation', () => {

      const invitation: Invitation = fixtures.addInvitation();
      const createdInvitation = db.getInvitation({id: invitation.id});
      should.exist(createdInvitation);
      createdInvitation.should.eql(invitation);
    });

    it('should update an invitation', () => {

      const invitation: Invitation = fixtures.addInvitation();
      invitation.status = 'accepted';
      invitation.modified = Date.now() / 1000;
      db.updateInvitation({
        invitation: invitation
      });
      const updatedInvitation = db.getInvitation({id: invitation.id});

      updatedInvitation.status.should.eql(invitation.status);
      updatedInvitation.modified.should.eql(invitation.modified);

      updatedInvitation.id.should.eql(invitation.id);
      updatedInvitation.campaign.should.eql(invitation.campaign);
      updatedInvitation.requester.should.eql(invitation.requester);
      updatedInvitation.requestee.should.eql(invitation.requestee);
      updatedInvitation.created.should.eql(invitation.created);
      updatedInvitation.accessToken.should.eql(invitation.accessToken);
    });

  });

  describe('Users', () => {

    it('should return if the user exists or not', () => {
      const createdUser: User = fixtures.addUser();
      createdUser.exists(db).should.eql(true);
      const notCreatedUser: User = fixtures.getUser();
      notCreatedUser.exists(db).should.eql(false);
    })

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
      createdUser.should.eql(fullUser);
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