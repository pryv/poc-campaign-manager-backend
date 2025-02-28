/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
// @flow

import type sqlite3 from 'better-sqlite3';
import type { Statement } from 'better-sqlite3';
const { Campaign, User } = require('../business');

class Campaigns {

  db: sqlite3;

  saveStatement: Statement;

  getStatement: Statement;
  getOneStatement: Statement;
  getOneByPryvAppIdStatement: Statement;

  cancelStatement: Statement;

  constructor(params: {db: sqlite3}) {
    this.db = params.db;

    this.initBindings();
  }

  initBindings(): void {
    this.saveStatement = this.db.prepare(
      'INSERT INTO campaigns ( ' +
      'campaign_id, ' +
      'title, ' +
      'pryv_app_id, ' +
      'description, ' +
      'permissions, ' +
      'created, ' +
      'modified, ' +
      'status, ' +
      'user_id ' +
      ') ' +
      'VALUES ( ' +
      '@campaign_id, ' +
      '@title, ' +
      '@pryv_app_id, ' +
      '@description, ' +
      '@permissions, ' +
      '@created, ' +
      '@modified, ' +
      '@status, ' +
      '@user_id ' +
      ');'
    );

    this.getStatement = this.db.prepare(
      'SELECT * ' +
      'FROM campaigns ' +
      'WHERE user_id = @user_id;'
    );

    this.getOneStatement = this.db.prepare(
      'SELECT ' +
      '' +
      'c.*, ' +
      '' +
      'local_users.username as requester ' +
      '' +
      ' FROM campaigns c ' +
      '' +
      ' INNER JOIN local_users ON c.user_id=local_users.user_id ' +
      '' +
      'WHERE ' +
      ' campaign_id = @campaign_id;'
    );

    this.getOneByPryvAppIdStatement = this.db.prepare(
      'SELECT ' +
      '' +
      'c.*, ' +
      '' +
      'local_users.username as requester ' +
      '' +
      ' FROM campaigns c ' +
      '' +
      ' INNER JOIN local_users ON c.user_id=local_users.user_id ' +
      '' +
      'WHERE ' +
      ' pryv_app_id = @pryvAppId;'
    );

    this.cancelStatement = this.db.prepare(
      'UPDATE campaigns ' +
      ' ' +
      'SET ' +
      ' status = @status, ' +
      ' modified = @modified ' +
      ' ' +
      'WHERE campaign_id = @campaign_id;'
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
      modified: params.campaign.modified,
      status: params.campaign.status,
      user_id: params.user.id,
    });
  }

  get(params: {user: User}): Array<Campaign> {
    return this.getStatement.all({
      user_id: params.user.id
    }).map(convertFromDB);
  }

  getOne(params: {
    campaignId: string,
  }): Campaign {
    return convertFromDB(this.getOneStatement.get({
      campaign_id: params.campaignId,
    }));
  }

  getOneByPryvAppId(params: {
    pryvAppId: string,
  }): Campaign {
    return convertFromDB(this.getOneByPryvAppIdStatement
      .get({
        pryvAppId: params.pryvAppId,
      }));
  }

  cancel(params: {
    campaign: Campaign,
  }): Campaign {
    this.cancelStatement.run({
      campaign_id: params.campaign.id,
      modified: params.campaign.modified,
      status: 'cancelled',
    });
    return params.campaign;
  }

}
module.exports = Campaigns;


function convertFromDB(result: mixed): User {
  if (result == null) {
    return null;
  }
  return new Campaign({
    id: result.campaign_id,
    title: result.title,
    pryvAppId: result.pryv_app_id,
    description: result.description,
    permissions: JSON.parse(result.permissions),
    created: result.created,
    modified: result.modified,
    status: result.status,
    requester: result.requester,
  });
}
