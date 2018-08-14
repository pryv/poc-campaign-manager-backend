// @flow

import {Database} from '../../src/database';
import {User, Campaign, Invitation, Access} from '../../src/business';
import charlatan from 'charlatan';
import cuid from 'cuid';

const config = require('../../src/config');

export class Fixtures {

  db: Database;

  constructor() {
    this.db = new Database({path: config.get('database:path')});
  }

  getUser(params?: {
    full: boolean,
    localOnly: boolean,
    pryvOnly: boolean,
    linked: boolean,
  }): User {
    if (params == null) {
      params = { linked: true };
    }

    let user = null;

    if (params.pryvOnly) {
      user = new User({
        pryvUsername: charlatan.Name.firstName().toLowerCase(),
      });
    } else if (params.localOnly) {
      user = new User({
        username: charlatan.Name.firstName().toLowerCase(),
        password: charlatan.Internet.password(),
      });
    } else if (params.linked) {
      const username = charlatan.Name.firstName().toLowerCase();
      user = new User({
        username: username,
        password: charlatan.Internet.password(),
        pryvUsername: username,
        pryvToken: cuid(),
      });
    } else {
      user = new User({
        username: charlatan.Name.firstName().toLowerCase(),
        pryvUsername: charlatan.Name.firstName().toLowerCase(),
        password: charlatan.Internet.password(),
        pryvToken: cuid(),
      });
    }

    return user;
  }

  addUser(params?: {
    full?: boolean,
    localOnly?: boolean,
    pryvOnly?: boolean,
    linked?: boolean,
  }): User {
    const user: User = this.getUser(params);

    this.db.users.save(user);

    return user;
  }

  addAccess(params: {
    user: User,
  }): Access {
    return params.user.addAccess({
      db: this.db,
      access: new Access(),
    });
  }

  getInvitation(params?: {
    campaign?: Campaign,
    requester?: User,
    requestee?: User,
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
      accessToken: params.accesToken,
      status: params.status,
      modified: params.modified,
      created: params.created,
    });

    return invitation;
  }

  addInvitation(params?: {
    campaign?: Campaign,
    requester?: User,
    requestee?: User,
  }): Invitation {

    const invitation = this.getInvitation(params);
    invitation.save({
      db: this.db,
    });
    return invitation;
  }

  getCampaign(): Campaign {
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

  addCampaign(params?: {user: User}): Campaign {
    if (! params) {
      params = {};
    }

    const campaign = this.getCampaign(params);

    this.db.campaigns.save({
      campaign: campaign,
      user: params.user || this.addUser()
    });

    return campaign;
  }

  close(): void {
    this.db.close();
  }
}