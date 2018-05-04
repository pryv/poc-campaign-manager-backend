
import {Database} from '../../src/database';
import {User, Campaign} from '../../src/business';
import charlatan from 'charlatan';

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

  addCampaign(params: {user: User}): Campaign {
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