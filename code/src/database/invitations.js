// @flow

const bluebird = require('bluebird');

import typeof sqlite3 from 'better-sqlite3';
import {Invitation, User, Campaign} from '../business';
import {Statement} from 'better-sqlite3';

export class Invitations {

  db: sqlite3;
  saveStatement: Statement;
  getStatement: Statement;
  getOneStatement: Statement;
  updateOneStatement: Statement;

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
      'requestee_id' +
      ') VALUES (' +
      '@invitation_id, ' +
      '@access_token,' +
      '@status,' +
      '@created,' +
      '@modified,' +
      '@campaign_id,' +
      '@requester_id,' +
      '@requestee_id' +
      ');');


    this.getStatement = this.db.prepare(
      'SELECT ' +
      '' +
      'i.*, ' +
      '' +
      'rer.user_id as requester_id, ' +
      'rer.username as requester_username, ' +
      'rerp.pryv_username as requester_pryv_username, ' +
      'rerp.pryv_user_id as requester_pryv_id, ' +
      '' +
      'ree.user_id as requestee_id, ' +
      'ree.username as requestee_username, ' +
      'reep.pryv_username as requestee_pryv_username, ' +
      'reep.pryv_user_id as requestee_pryv_id, ' +
      '' +
      'c.campaign_id as campaign_id, ' +
      'c.title as campaign_title, ' +
      'c.pryv_app_id as campaign_pryv_app_id, ' +
      'c.description as campaign_description, ' +
      'c.created as campaign_created,' +
      'c.permissions as campaign_permissions ' +
      '' +
      ' FROM invitations i ' +
      '' +
      ' INNER JOIN users rer ON rer.user_id=i.requester_id ' +
      ' INNER JOIN users ree ON ree.user_id=i.requestee_id ' +
      '' +
      ' LEFT OUTER JOIN pryv_users rerp ON rerp.user_id=rer.user_id ' +
      ' LEFT OUTER JOIN pryv_users reep ON reep.user_id=ree.user_id ' +
      '' +
      ' INNER JOIN campaigns c ON c.campaign_id=i.campaign_id ' +
      '' +
      'WHERE ' +
      ' i.requester_id=@user_id OR ' +
      ' i.requestee_id=@user_id ' +
      '' +
      'ORDER BY ' +
      ' i.created DESC ' +
      '' +
      'LIMIT 1000'
    );

    this.getOneStatement = this.db.prepare(
      'SELECT ' +
      '' +
      'i.*, ' +
      '' +
      'rer.user_id as requester_id, ' +
      'rer.username as requester_username, ' +
      'rerp.pryv_username as requester_pryv_username, ' +
      'rerp.pryv_user_id as requester_pryv_id, ' +
      '' +
      'ree.user_id as requestee_id, ' +
      'ree.username as requestee_username, ' +
      'reep.pryv_username as requestee_pryv_username, ' +
      'reep.pryv_user_id as requestee_pryv_id, ' +
      '' +
      'c.campaign_id as campaign_id, ' +
      'c.title as campaign_title, ' +
      'c.pryv_app_id as campaign_pryv_app_id, ' +
      'c.description as campaign_description, ' +
      'c.created as campaign_created,' +
      'c.permissions as campaign_permissions ' +
      '' +
      ' FROM invitations i ' +
      '' +
      ' INNER JOIN users rer ON rer.user_id=i.requester_id ' +
      ' INNER JOIN users ree ON ree.user_id=i.requestee_id ' +
      '' +
      ' LEFT OUTER JOIN pryv_users rerp ON rerp.user_id=rer.user_id ' +
      ' LEFT OUTER JOIN pryv_users reep ON reep.user_id=ree.user_id ' +
      '' +
      ' INNER JOIN campaigns c ON c.campaign_id=i.campaign_id ' +
      '' +
      'WHERE ' +
      ' i.invitation_id=@invitation_id'
    );

    this.updateOneStatement = this.db.prepare(
      'UPDATE invitations ' +
      '' +
      'SET ' +
      ' access_token = @access_token, ' +
      ' status = @status, ' +
      ' modified = @modified ' +
      '' +
      'WHERE' +
      ' invitation_id = @invitation_id'
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
        campaign_id: params.invitation.campaign.id,
        requester_id: params.invitation.requester.id,
        requestee_id: params.invitation.requestee.id,
      }
    );
    return params.invitation;
  }

  get(params: {user: User}): Array<Invitation> {
    return this.getStatement.all({
      user_id: params.user.id
    }).map(convertFromDB);
  }

  getOne(params: {id: string}): Invitation {
    return convertFromDB(this.getOneStatement.get({
      invitation_id: params.id
    }));
  }

  updateOne(params: {
    invitation: Invitation
  }): Invitation {
    return this.updateOneStatement.run({
      access_token: params.invitation.accessToken,
      status: params.invitation.status,
      modified: params.invitation.modified,
      invitation_id: params.invitation.id,
    });
  }

}

function convertFromDB(dbResult: mixed): Invitation {
  return new Invitation({
    id: dbResult.invitation_id,
    accessToken: dbResult.access_token,
    status: dbResult.status,
    created: dbResult.created,
    modified: dbResult.modified,
    requester: new User({
      id: dbResult.requester_id,
      username: dbResult.requester_username,
      pryvUsername: dbResult.requester_pryv_username,
      pryvId: dbResult.requester_pryv_id
      }),
    requestee: new User({
      id: dbResult.requestee_id,
      username: dbResult.requestee_username,
      pryvUsername: dbResult.requestee_pryv_username,
      pryvId: dbResult.requestee_pryv_id,
    }),
    campaign: new Campaign({
    id: dbResult.campaign_id,
    title: dbResult.campaign_title,
    pryvAppId: dbResult.campaign_pryv_app_id,
    description: dbResult.campaign_description,
    permissions: JSON.parse(dbResult.campaign_permissions),
    created: dbResult.campaign_created,
    })
  });
}