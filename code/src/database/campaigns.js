// @flow

const bluebird = require('bluebird');

import typeof sqlite3 from 'better-sqlite3';
import typeof {Transaction} from 'better-sqlite3';
import typeof {Campaign} from '../business/Campaign';
import typeof {User} from '../business/User';

export class Campaigns {

  db: sqlite3;
  saveTransaction: Transaction;

  constructor(params: {db: sqlite3}) {
    this.db = params.db;

    this.initTransactions();
  }

  save(params: {campaign: Campaign, user: User}) {
    this.saveTransaction.run(
      [
        {
          campaign_id: params.campaign.id,
          title: params.campaign.title,
          pryv_app_id: params.campaign.pryvAppId,
          description: params.campaign.description,
          permissions: params.campaign.permissions,
          created: params.campaign.created
        },
        {
          user_id: params.user.id,
          campaign_id2: params.campaign.id
        }
      ]

    );
  }

  initTransactions() {
    this.saveTransaction = this.db.transaction([
      'INSERT INTO campaigns (' +
      'campaign_id,' +
      'title,' +
      'pryv_app_id,' +
      'description,' +
      'permissions,' +
      'created' +
      ') ' +
      'VALUES ( @campaign_id, @title, @pryv_app_id, @description, @permissions, @created);',

      'INSERT INTO users_campaigns (' +
      'user_id_key,' +
      'campaign_id_key' +
      ') ' +
      'VALUES ( @user_id, @campaign_id2);'
    ]);
  }


}
