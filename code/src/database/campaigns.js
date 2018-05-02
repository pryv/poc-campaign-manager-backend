// @flow

const bluebird = require('bluebird');

import typeof sqlite3 from 'better-sqlite3';
import typeof {Campaign} from '../business/Campaign';
import typeof {User} from '../business/User';

export class Campaigns {

  db: sqlite3;

  constructor(params: {db: sqlite3}) {
    this.db = params.db;
  }

  save(params: { campaign: Campaign, user: User}) {
    this.db.transaction([
      'INSERT INTO campaigns (' +
      'campaign_id,' +
      'title,' +
      'pryv_app_id,' +
      'description,' +
      'permissions,' +
      'created' +
      ')' +
      'VALUES (\'' +
      params.campaign.id + '\', \'' +
      params.campaign.title + '\', \'' +
      params.campaign.pryvAppId + ', ' +
      params.campaign.description + '\', \'' +
      JSON.stringify(params.campaign.permissions) + ', ' +
      params.campaign.created +
        ');',
      'INSERT INTO users_campaigns (' +
      'user_id,' +
      'campaign_id,' +
      ')' +
      'VALUES (' +
      params.user.id + ',' +
      params.campaign.id + ');'
    ]).run();
  }
}
