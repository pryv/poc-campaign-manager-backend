// @flow

const sqlite3 = require('better-sqlite3');

import typeof {Campaign, User, Invitation} from '../business';

import {Campaigns} from './campaigns';
import {Users} from './users';
import {Invitations} from './invitations';

const logger = require('../logger');
const config = require('../config');

export class Database {

  db: typeof sqlite3;
  path: string;
  users: Users;
  campaigns: Campaigns;
  invitations: Invitations;

  constructor(params: {path: string}) {
    this.path = params.path;
    this.db = new sqlite3(this.path, config.get('database:options'));

    this.initTables();

    this.users = new Users({db: this.db});
    this.campaigns = new Campaigns({db: this.db});
    this.invitations = new Invitations({db: this.db});
  }

  initTables(): void {
    this.db.prepare(
      'CREATE TABLE IF NOT EXISTS users (' +
      'user_id string PRIMARY_KEY, ' +
      'username string UNIQUE ' +
      ')').run();
    this.db.prepare(
      'CREATE TABLE IF NOT EXISTS pryv_users (' +
      'pryv_user_id string PRIMARY_KEY, ' +
      'pryv_username string UNIQUE, ' +
      'user_id string UNIQUE' +
      ')').run();
    this.db.prepare(
      'CREATE TABLE IF NOT EXISTS campaigns (' +
      'campaign_id string PRIMARY_KEY,' +
      'title text NOT NULL,' +
      'pryv_app_id text,' +
      'description text NOT NULL,' +
      'permissions text NOT NULL,' +
      'created integer NOT NULL,' +
      'user_id string NOT NULL' +
      ')').run();
    this.db.prepare(
      'CREATE TABLE IF NOT EXISTS invitations (' +
      'invitation_id string PRIMARY_KEY,' +
      'access_token string,' +
      'status string NOT NULL,' +
      'created integer NOT NULL,' +
      'modified integer NOT NULL,' +
      'campaign_id string NOT NULL,' +
      'requester_id string NOT NULL,' +
      'requestee_id string NOT NULL' +
      ')').run();
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

  getUser(params: {
      username?: string,
      pryvUsername?: string,
  }): User {
    return this.users.getUser(params);
  }

  saveUser(user: User): void {
    return this.users.save(user);
  }

  getInvitations(params: {
    user: User,
  }): Invitation {
    return this.invitations.get({user: params.user});
  }

  saveInvitation(params: {
    invitation: Invitation,
  }): Invitation {
    return this.invitations.save(params);
  }

}

