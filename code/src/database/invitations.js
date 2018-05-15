// @flow

const bluebird = require('bluebird');

import typeof sqlite3 from 'better-sqlite3';
import {Invitation, User} from '../business';
import {Statement} from 'better-sqlite3';

export class Invitations {

  db: sqlite3;
  saveStatement: Statement;
  getStatement: Statement;

  constructor(params: {db: sqlite3}) {
    this.db = params.db;

    this.initBindings();
  }

  initBindings(): void {
    this.saveStatement = this.db.prepare(
        'INSERT INTO invitations (' +
        'invitation_id, ' +
        'access_token,' +
        'status,' +
        'created,' +
        'modified,' +
        'campaign_id,' +
        'requester_id,' +
        'requestee_id,' +
        'requestee_pryv_username' +
        ') VALUES (' +
        '@invitation_id, ' +
        '@access_token,' +
        '@status,' +
        '@created,' +
        '@modified,' +
        '@campaign_id,' +
        '@requester_id,' +
        '@requestee_id,' +
        '@requestee_pryv_username' +
        ');'
    );

    this.getStatement = this.db.prepare(
      'SELECT * ' +
      'FROM invitations ' +
      'WHERE requester_id = @requester_id'
    );
  }

  save(params: {
    invitation: Invitation,
  }): Invitation {
    this.saveStatement.run(
      {
        invitation_id: params.invitation.id,
        access_token: params.invitation.accessToken,
        status: params.invitation.status,
        created: params.invitation.created,
        modified: params.invitation.modified,
        campaign_id: params.invitation.campaignId,
        requester_id: params.invitation.requesterId,
        requestee_id: params.invitation.requesteeId,
        requestee_pryv_username: params.invitation.requesteePryvUsername,
      }
    );
    return params.invitation;
  }

  get(params: {requester: User}): Array<Invitation> {
    return this.getStatement.all({
      requester_id: params.requester.id
    }).map(convertFromDB);
  }

}

function convertFromDB(dbResult: mixed): Invitation {
  return new Invitation({
    id: dbResult.invitation_id,
    accessToken: dbResult.access_token,
    status: dbResult.status,
    created: dbResult.created,
    modified: dbResult.modified,
    requesterId: dbResult.requester_id,
    requesteeId: dbResult.requestee_id,
    campaignId: dbResult.campaign_id,
    requesteePryvUsername: dbResult.requestee_pryv_username,
  });
}