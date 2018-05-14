// @flow

const bluebird = require('bluebird');

import typeof sqlite3 from 'better-sqlite3';
import {Invitation, User, Campaign} from '../business';
import {Transaction} from 'better-sqlite3';

export class Invitations {

  db: sqlite3;
  saveTransaction: Transaction;

  constructor(params: {db: sqlite3}) {
    this.db = params.db;

    this.initBindings();
  }

  initBindings(): void {
    this.saveTransaction = this.db.transaction([
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
        '@created,' +
        '@modified' +
        ');',
        'INSERT INTO users_users_campaigns_invitations (' +
        'requester_id,' +
        'requestee_id,' +
        'campaign_id,' +
        'invitation_id' +
        ') VALUES (' +
        '@requester_id,' +
        '@requestee_id,' +
        '@campaign_id,' +
        '@invitation_id' +
        ');'
    ]);

    /*this.getStatement = this.db.prepare({

    });*/
  }

  save(params: {
    invitation: Invitation
  }): Invitation {
    this.saveTransaction.run(
      {
        invitation_id: params.invitation.id,
        access_token: params.invitation.accessToken,
        status: params.invitation.status,
        created: params.invitation.created,
        modified: params.invitation.modified,
        requester_id: params.invitation.requesterId,
        requestee_id: params.invitation.requesteeId,
        campaign_id: params.invitation.campaignId,
      }
    );
    return params.invitation;
  }

  get(params: {requester: User}): Array<Invitation> {
    return this.db.prepare(
      'SELECT i.invitation_id, i.access_token, i.status, i.modified, i.created, uuci.requestee_id, uuci.campaign_id ' +
      'FROM invitations i ' +
      'INNER JOIN users_users_campaigns_invitations uuci ON uuci.invitation_id = i.invitation_id ' +
      'INNER JOIN users u ON u.user_id = uuci.requester_id ' +
      'WHERE user_id = \'' + params.requester.id + '\''
    ).all().map(convertFromDB.bind(null, params.requester.id));
  }

}

function convertFromDB(userId: string, dbResult: mixed): Invitation {
  return new Invitation({
    id: dbResult.invitation_id,
    accessToken: dbResult.access_token,
    status: dbResult.status,
    created: dbResult.created,
    modified: dbResult.modified,
    requesterId: userId,
    requesteeId: dbResult.requestee_id,
    campaignId: dbResult.campaign_id
  });
}