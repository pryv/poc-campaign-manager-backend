// @flow

const bluebird = require('bluebird');

import typeof sqlite3 from 'better-sqlite3';
import typeof {Statement} from 'better-sqlite3';
import {Campaign, User} from '../business';

const logger = require('../logger');

export class Campaigns {

  db: sqlite3;
  saveStatement: Statement;

  constructor(params: {db: sqlite3}) {
    this.db = params.db;

    this.initBindings();
  }

  initBindings(): void {
    this.saveStatement = this.db.prepare(
      'INSERT INTO campaigns (' +
      'campaign_id,' +
      'title,' +
      'pryv_app_id,' +
      'description,' +
      'permissions,' +
      'created,' +
      'user_id' +
      ') ' +
      'VALUES (' +
      '@campaign_id,' +
      '@title,' +
      '@pryv_app_id,' +
      '@description,' +
      '@permissions,' +
      '@created,' +
      '@user_id' +
      ')'
    );

    this.getStatement = this.db.prepare(
      'SELECT * ' +
      'FROM campaigns ' +
      'WHERE user_id = @user_id'
    );
  }

  save(params: {campaign: Campaign, user: User}): void {
    this.saveStatement.run({
      campaign_id: params.campaign.id,
      title: params.campaign.title,
      pryv_app_id: params.campaign.pryvAppId,
      description: params.campaign.description,
      permissions: JSON.stringify(params.campaign.permissions),
      created: params.campaign.created,
      user_id: params.user.id
    });
  }

  get(params: {user: User}): Array<Campaign> {
    return this.getStatement.all({
      user_id: params.user.id
    }).map(convertFromDB);
  }

}


function convertFromDB(result: mixed): User {
  return new Campaign({
    id: result.campaign_id,
    title: result.title,
    pryvAppId: result.pryv_app_id,
    description: result.description,
    permissions: JSON.parse(result.permissions),
    created: result.created,

  });
}
