// @flow

const sqlite3 = require('better-sqlite3');

import typeof {Campaign, User, Invitation} from '../business';

import {Campaigns} from './campaigns';
import {Users} from './users';
import {Invitations} from './invitations';

const logger = require('../logger');

export class Database {

  db: typeof sqlite3;
  path: string;
  users: Users;
  campaigns: Campaigns;
  invitations: Invitations;

  constructor(params: {path: string}) {
    this.path = params.path;
    this.db = new sqlite3(this.path);

    this.initTables();

    this.users = new Users({db: this.db});
    this.campaigns = new Campaigns({db: this.db});
    this.invitations = new Invitations({db: this.db});
  }

  initTables(): void {
    this.db.prepare(
      'CREATE TABLE IF NOT EXISTS users (' +
      'user_id string PRIMARY_KEY, ' +
      'username text NOT NULL UNIQUE' +
      ')').run();
    this.db.prepare(
      'CREATE TABLE IF NOT EXISTS campaigns (' +
      'campaign_id string PRIMARY_KEY,' +
      'title text NOT NULL,' +
      'pryv_app_id text,' +
      'description text NOT NULL,' +
      'permissions text NOT NULL,' +
      'created integer NOT NULL' +
      ')').run();
    this.db.prepare(
      'CREATE TABLE IF NOT EXISTS users_campaigns (' +
      'user_id_key string,' +
      'campaign_id_key string,' +
      'PRIMARY KEY (user_id_key, campaign_id_key)' + //,' +
      //'FOREIGN KEY(user_id_key) REFERENCES users (user_id)' +
      //'ON DELETE CASCADE ON UPDATE NO ACTION,' +
      //'FOREIGN KEY(campaign_id_key) REFERENCES campaigns (campaign_id)' +
      //'ON DELETE CASCADE ON UPDATE NO ACTION' +
      ')').run();
    this.db.prepare(
      'CREATE TABLE IF NOT EXISTS invitations (' +
      'invitation_id string PRIMARY_KEY,' +
      'access_token string NOT NULL,' +
      'status string NOT NULL,' +
      'created integer NOT NULL,' +
      'modified integer NOT NULL)').run();
    this.db.prepare(
      'CREATE TABLE IF NOT EXISTS users_users_campaigns_invitations (' +
      'requester_id string,' +
      'requestee_id string,' +
      'campaign_id string,' +
      'invitation_id string,' +
      'PRIMARY KEY (requester_id, campaign_id, invitation_id))').run();
  }

  close(): void {
    return this.db.close();
  }

  getCampaigns(params: {user: User}): Array<Campaign> {
    return this.campaigns.get({user: params.user});
  }

  saveCampaign(params: {
    campaign: Campaign,
    user: User
  }): void {
    return this.campaigns.save({
      campaign: params.campaign,
      user: params.user
    });
  }

  getUsers(): Array<User> {
    return this.users.get();
  }

  saveUser(user: User): void {
    return this.users.save(user);
  }

  getInvitations(params: {
    requester: User
  }): Invitation {
    return this.invitations.get({requester: params.requester});
  }

  saveInvitation(params: {
    invitation: Invitation
  }): Invitation {
    return this.invitations.save({
      invitation: params.invitation
    });
  }

}

