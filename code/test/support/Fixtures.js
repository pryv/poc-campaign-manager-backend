
import {Database} from '../../src/database';
import {User, Campaign, Invitation, InvitationStatus} from '../../src/business';
import charlatan from 'charlatan';
import cuid from 'cuid';

const config = require('../../src/config');

export class Fixtures {

  db: Database;

  constructor() {
    this.db = new Database({path: config.get('database:path')});
  }

  getUser(params: {
    full: boolean,
    appOnly: boolean,
    pryvOnly: boolean,
  }): User {
    if (params == null) {
      params = { full: true };
    }
    let user = null;

    if (params.full) {
      user = new User({
        username: charlatan.Name.firstName().toLowerCase(),
        pryvUsername: charlatan.Name.firstName().toLowerCase(),
      });
    } else if (params.pryvOnly) {
      user = new User({
        pryvUsername: charlatan.Name.firstName().toLowerCase()
      });
    } else if (params.appOnly) {
      user = new User({
        username: charlatan.Name.firstName().toLowerCase()
      });
    }
    return user;
  }

  addUser(params: {
    full: boolean,
    appOnly: boolean,
    pryvOnly: boolean,
  }): User {
    const user: User = this.getUser(params);

    this.db.saveUser(user);
    return user;
  }

  getInvitation(params: {
    campaign: Campaign,
    requester: User,
    requestee: User,
  }): Invitation {

    if (params == null) {
      params = {};
    }

    if (params.requester == null) {
      params.requester = this.addUser({full: true});
    }
    if (params.campaign == null) {
      params.campaign = this.addCampaign({user: params.requester});
    }
    if (params.requestee == null) {
      params.requestee = this.addUser({full: true});
    }

    const invitation = new Invitation({
      campaign: params.campaign,
      requester: params.requester,
      requestee: params.requestee,
      accessToken: cuid()
    });

    return invitation;
  }

  addInvitation(params: {
    campaign: Campaign,
    requester: User,
    requestee: User,
  }): Invitation {

    const invitation = this.getInvitation(params);
    this.db.saveInvitation({
      invitation: invitation,
    });
    return invitation;
  }

  getCampaign(params: {user: User}): Campaign {
    const streamId = charlatan.Lorem.word();

    const campaign = new Campaign({
      title: charlatan.Company.bs().substring(0,10),
      description: charlatan.Lorem.text().substring(0, 20),
      permissions: [
        {
          streamId: streamId,
          defaultName: charlatan.Helpers.capitalize(streamId),
          level: 'read'
        }
      ],
      created: Date.now() / 1000
    });

    return campaign;
  }

  addCampaign(params: {user: User}): Campaign {

    const campaign = this.getCampaign({user: params.user});

    this.db.saveCampaign({
      campaign: campaign,
      user: params.user
    });

    return campaign;
  }

  close(): void {
    this.db.close();
  }
}