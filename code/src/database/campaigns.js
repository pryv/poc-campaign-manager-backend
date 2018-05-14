// @flow

const bluebird = require('bluebird');

import typeof sqlite3 from 'better-sqlite3';
import typeof {Transaction} from 'better-sqlite3';
import {Campaign, User, Invitation} from '../business';

const logger = require('../logger');

export class Campaigns {

  db: sqlite3;
  saveTransaction: Transaction;

  constructor(params: {db: sqlite3}) {
    this.db = params.db;
    this.initBindings();
  }

  initBindings(): void {
    this.saveTransaction = this.db.transaction([
      'INSERT INTO campaigns (' +
      'campaign_id, ' +
      'title,' +
      'pryv_app_id,' +
      'description,' +
      'permissions,' +
      'created,' +
      'invitation_id' +
      ') VALUES (' +
      '@campaign_id, ' +
      '@title,' +
      '@pryv_app_id,' +
      '@description,' +
      '@permissions,' +
      '@created,' +
      '@invitation_id' +
      ');',

      'INSERT INTO users_campaigns (' +
      'user_id_key,' +
      'campaign_id_key' +
      ') VALUES (' +
      '@user_id,' +
      '@campaign_id' +
      ');',

      'INSERT INTO invitations (' +
      'invitation_id, ' +
      'access_token,' +
      'status,' +
      'created,' +
      'modified' +
      ') VALUES (' +
      '@invitation_id, ' +
      '@access_token,' +
      '@status,' +
      '@invitation_created,' +
      '@modified' +
      ');',

      'INSERT INTO users_users_campaigns_invitations (' +
      'requester_id,' +
      'requestee_id,' +
      'campaign_id,' +
      'invitation_id' +
      ') VALUES (' +
      '@user_id,' +
      '@requestee_id,' +
      '@campaign_id,' +
      '@invitation_id' +
      ');'
    ]);

  }

  save(params: {campaign: Campaign, user: User, invitation: Invitation}): void {
    this.saveTransaction.run({
      campaign_id: params.campaign.id,
      title: params.campaign.title,
      pryv_app_id: params.campaign.pryvAppId,
      description: params.campaign.description,
      permissions: JSON.stringify(params.campaign.permissions),
      created: params.campaign.created,
      user_id: params.user.id,
      invitation_id: params.invitation.id,
      access_token: params.invitation.accessToken,
      status: params.invitation.status,
      invitation_created: params.invitation.created,
      modified: params.invitation.modified,
      requestee_id: null
    });

    return params.campaign;
  }

  get(params: {user: User}): Array<Campaign> {
    return this.db.prepare(
      'SELECT * ' +
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
    created: campaign.created,
    invitationId: campaign.invitation_id
  });
}
