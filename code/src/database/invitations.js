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
      'rerl.username as requester_username, ' +
      'rerl.local_user_id as requester_local_id, ' +
      'rerp.pryv_username as requester_pryv_username, ' +
      'rerp.pryv_user_id as requester_pryv_id, ' +
      '' +
      'ree.user_id as requestee_id, ' +
      'reel.username as requestee_username, ' +
      'reel.local_user_id as requestee_local_id, ' +
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
      ' LEFT OUTER JOIN local_users rerl ON rerl.user_id=rer.user_id ' +
      ' LEFT OUTER JOIN local_users reel ON reel.user_id=ree.user_id ' +
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
      'rerl.username as requester_username, ' +
      'rerl.local_user_id as requester_local_id, ' +
      'rerp.pryv_username as requester_pryv_username, ' +
      'rerp.pryv_user_id as requester_pryv_id, ' +
      '' +
      'ree.user_id as requestee_id, ' +
      'reel.username as requestee_username, ' +
      'reel.local_user_id as requestee_local_id, ' +
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
      ' LEFT OUTER JOIN local_users rerl ON rerl.user_id=rer.user_id ' +
      ' LEFT OUTER JOIN local_users reel ON reel.user_id=ree.user_id ' +
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
    this.updateOneStatement.run({
      access_token: params.invitation.accessToken,
      status: params.invitation.status,
      modified: params.invitation.modified,
      invitation_id: params.invitation.id,
    });
    return params.invitation;
  }

}

function convertFromDB(result: mixed): Invitation {
  if (result == null) {
    return null;
  }

  return new Invitation({
    id: result.invitation_id,
    accessToken: result.access_token,
    status: result.status,
    created: result.created,
    modified: result.modified,
    requester: new User({
      id: result.requester_id,
      username: result.requester_username,
      pryvUsername: result.requester_pryv_username,
      pryvId: result.requester_pryv_id,
      localId: result.requester_local_id,
      }),
    requestee: new User({
      id: result.requestee_id,
      username: result.requestee_username,
      pryvUsername: result.requestee_pryv_username,
      pryvId: result.requestee_pryv_id,
      localId: result.requestee_local_id,
    }),
    campaign: new Campaign({
    id: result.campaign_id,
    title: result.campaign_title,
    pryvAppId: result.campaign_pryv_app_id,
    description: result.campaign_description,
    permissions: JSON.parse(result.campaign_permissions),
    created: result.campaign_created,
    })
  });
}