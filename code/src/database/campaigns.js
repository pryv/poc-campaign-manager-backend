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
      'VALUES (' +
      campaign.id + ', ' +
      campaign.title + ', ' +
      campaign.pryvAppId + ', ' +
      campaign.description + ', ' +
      campaign.permissionsSet + ', ' +
      campaign.created +
        ');',
      'INSERT INTO users_campaigns (' +
      'user_id,' +
      'campaign_id,' +
      ')' +
      'VALUES (' +
      user.id + ',' +
      campaign.id + ');'
    ]).run();
  }
}

/*
* 'CREATE TABLE IF NOT EXISTS users_campaigns (' +
 'user_id integer,' +
 'campaign_id integer,' +
* */