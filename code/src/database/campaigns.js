// @flow

const bluebird = require('bluebird');

import typeof sqlite3 from 'better-sqlite3';
import typeof {Transaction} from 'better-sqlite3';
import {Campaign} from '../business/Campaign';
import typeof {User} from '../business/User';

const logger = require('../logger');

export class Campaigns {

  db: sqlite3;

  constructor(params: {db: sqlite3}) {
    this.db = params.db;
  }

  save(params: {campaign: Campaign, user: User}) {
    this.db.transaction([
      'INSERT INTO campaigns (' +
      'campaign_id,' +
      'title,' +
      'pryv_app_id,' +
      'description,' +
      'permissions,' +
      'created' +
      ') ' +
      'VALUES (\'' +
      params.campaign.id + '\', \'' +
      params.campaign.title + '\', \'' +
      params.campaign.pryvAppId + '\', \'' +
      params.campaign.description + '\', \'' +
      JSON.stringify(params.campaign.permissions) + '\', ' +
      params.campaign.created +
      ')',

      'INSERT INTO users_campaigns (' +
      'user_id_key,' +
      'campaign_id_key' +
      ') ' +
      'VALUES (\'' +
      params.user.id + '\', \'' +
      params.campaign.id +
      '\');'
    ]).run();
  }

  get(params: {user: User}): Array<Campaign> {
    return this.db.prepare(
      'SELECT c.campaign_id, c.title, c.pryv_app_id, c.description, c.permissions, c.created ' +
      'FROM campaigns c ' +
      'INNER JOIN users_campaigns uc ON uc.campaign_id_key = c.campaign_id ' +
      'INNER JOIN users u ON u.user_id = uc.user_id_key ' +
      'WHERE user_id = \'' + params.user.id + '\''
    ).all().map(convertFromDB);
  }

}


function convertFromDB(campaign: mixed): User {
  return new Campaign({
    id: campaign.campaign_id,
    title: campaign.title,
    pryvAppId: campaign.pryv_app_id,
    description: campaign.description,
    permissions: JSON.parse(campaign.permissions),
    created: campaign.created
  });
}
