
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

  addUser(): User {
    const user = new User({
      username: charlatan.Name.firstName().toLowerCase()
    });
    this.db.saveUser(user);
    return user;
  }

  getInvitation(params: {
    campaign: Campaign,
    requester: User,
    requestee?: User,
  }): Invitation {
    let requesteeId = null;
    if (params.requestee) {
      requesteeId = params.requestee.id;
    }

    const invitation = new Invitation({
      campaignId: params.campaign.id,
      requesterId: params.requester.id,
      requesteeId: requesteeId,
      accessToken: cuid()
    });

    return invitation;
  }

  addInvitation(params: {
    campaign: Campaign,
    requester: User,
    requestee?: User,
  }): Invitation {

    const invitation = this.getInvitation(params)

    this.db.saveInvitation({
      invitation: invitation
    });
    return invitation;
  }

  getCampaign(params: {user: User}): Campaign {
    const streamId = charlatan.Lorem.word();

    const campaign = new Campaign({
      title: charlatan.Company.bs(),
      username: charlatan.Name.firstName().toLowerCase(),
      pryvAppId: charlatan.Internet.domainName(),
      description: charlatan.Lorem.text(),
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

    const campaign: Campaign = this.getCampaign({user: params.user});

    return campaign.save({
      db: this.db,
      user: params.user
    });
  }

  close(): void {
    this.db.close();
  }
}