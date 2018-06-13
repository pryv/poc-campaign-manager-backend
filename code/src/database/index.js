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
      'user_id string PRIMARY_KEY ' +
      ')').run();
    this.db.prepare(
      'CREATE TABLE IF NOT EXISTS local_users (' +
      'local_user_id string PRIMARY_KEY, ' +
      'username string UNIQUE, ' +
      'password string, ' +
      'user_id string UNIQUE' +
      ')').run();
    this.db.prepare(
      'CREATE TABLE IF NOT EXISTS pryv_users (' +
      'pryv_user_id string PRIMARY_KEY, ' +
      'pryv_username string UNIQUE, ' +
      'pryv_token string, ' +
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
    return this.campaigns.get(params);
  }

  getCampaign(params: {
    user: User,
    campaignId: string,
  }): Campaign {
    return this.campaigns.getOne(params);
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

  getPassword(params: {
    user: User
  }): string {
    return this.users.getPassword(params);
  }

  getPryvToken(params: {
    user: User
  }): string {
    return this.users.getPryvToken(params);
  }

  getUsers(): Array<User> {
    return this.users.get();
  }

  getUser(params: {
      id?: string,
      username?: string,
      pryvUsername?: string,
      pryv_id?: string,
  }): User {
    return this.users.getOne(params);
  }

  saveUser(user: User): User {
    return this.users.save(user);
  }

  updateUser(params: {
    user: User,
    update: mixed
  }): User {
    return this.users.updateOne(params);
  }

  addPryvAccountToUser(params: {
    user: User,
  }): User {
    return this.users.addPryvUser(params);
  }

  updatePryvToken(params: {
    user: User,
  }): User {
    return this.users.updatePryvToken(params);
  }

  mergePryvUser(params: {
    user: User,
    pryvUser: User,
  }): User {
    return this.users.mergePryvUser(params);
  }

  getInvitations(params: {
    user: User,
  }): Array<Invitation> {
    return this.invitations.get({user: params.user});
  }

  getInvitation(params: {
    id: string,
  }): Invitation {
    return this.invitations.getOne(params);
  }

  saveInvitation(params: {
    invitation: Invitation,
  }): Invitation {
    return this.invitations.save(params);
  }

  updateInvitation(params: {
    invitation: Invitation,
  }): Invitation {
    return this.invitations.updateOne(params);
  }

}

