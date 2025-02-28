/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
// @flow

const sqlite3 = require('better-sqlite3');

const Accesses = require('./accesses');
const Campaigns = require('./campaigns');
const Users = require('./users');
const Invitations = require('./invitations');
const config = require('../config');

class Database {

  db: typeof sqlite3;
  users: Users;
  campaigns: Campaigns;
  invitations: Invitations;
  accesses: Accesses;

  constructor() {
    this.db = new sqlite3(config.get('database:path') , config.get('database:options'));

    this.initTables();

    this.users = new Users({db: this.db});
    this.campaigns = new Campaigns({db: this.db});
    this.invitations = new Invitations({db: this.db});
    this.accesses = new Accesses({db: this.db});
  }

  initTables(): void {
    this.db.prepare(
      'CREATE TABLE IF NOT EXISTS users (' +
      'user_id string PRIMARY KEY NOT NULL ' +
      ');').run();
    this.db.prepare(
      'CREATE TABLE IF NOT EXISTS local_users (' +
      'local_user_id string PRIMARY KEY NOT NULL, ' +
      'username string UNIQUE NOT NULL, ' +
      'password string NOT NULL, ' +
      'user_id string UNIQUE NOT NULL, ' +
      'FOREIGN KEY(user_id) REFERENCES users(user_id) ' +
      ');').run();
    this.db.prepare(
      'CREATE TABLE IF NOT EXISTS pryv_users ( ' +
      'pryv_user_id string PRIMARY KEY NOT NULL, ' +
      'pryv_username string UNIQUE, ' +
      'pryv_token string, ' +
      'user_id string UNIQUE NOT NULL, ' +
      'FOREIGN KEY(user_id) REFERENCES users(user_id) ' +
      ');').run();
    this.db.prepare(
      'CREATE TABLE IF NOT EXISTS campaigns ( ' +
      'campaign_id STRING PRIMARY KEY NOT NULL, ' +
      'title text NOT NULL, ' +
      'pryv_app_id text, ' +
      'description text NOT NULL, ' +
      'permissions text not NULL, ' +
      'created integer NOT NULL, ' +
      'modified integer NOT NULL, ' +
      'status string NOT NULL, ' +
      'user_id string NOT NULL, ' +
      'FOREIGN KEY(user_id) REFERENCES users(user_id) ' +
      ');').run();
    this.db.prepare(
      'CREATE TABLE IF NOT EXISTS invitations ( ' +
      'invitation_id string PRIMARY KEY NOT NULL, ' +
      'access_token string, ' +
      'status string NOT NULL, ' +
      'created integer NOT NULL, ' +
      'modified integer NOT NULL, ' +
      'campaign_id string NOT NULL, ' +
      'requester_id string NOT NULL, ' +
      'requestee_id string NOT NULL, ' +
      'head_id string, ' +
      'FOREIGN KEY(requester_id) REFERENCES users(user_id), ' +
      'FOREIGN KEY(requestee_id) REFERENCES users(user_id), ' +
      'FOREIGN KEY(campaign_id) REFERENCES campaigns(campaign_id) ' +
      ');').run();
    this.db.prepare(
      'CREATE TABLE IF NOT EXISTS accesses ( ' +
      'access_id string PRIMARY KEY NOT NULL, ' +
      'created integer NOT NULL, ' +
      'valid boolean NOT NULL, ' +
      'valid_until integer NOT NULL, ' +
      'user_id string NOT NULL, ' +
      'FOREIGN KEY(user_id) REFERENCES users(user_id) ' +
      ');').run();
    this.db.prepare(
      'CREATE TABLE IF NOT EXISTS versions ( ' +
      'version integer PRIMARY KEY ' +
      ');').run();
    this.db.pragma('foreign_keys=ON', true);
  }

  close(): void {
    return this.db.close();
  }

}
module.exports = Database;
