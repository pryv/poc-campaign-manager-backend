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
      'CREATE TABLE IF NOT EXISTS campaigns ( ' +
      'campaign_id string PRIMARY_KEY, ' +
      'title text NOT NULL, ' +
      'pryv_app_id text, ' +
      'description text NOT NULL, ' +
      'permissions text NOT NULL, ' +
      'created integer NOT NULL, ' +
      'modified integer NOT NULL, ' +
      'status string NOT NULL, ' +
      'user_id string NOT NULL ' +
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
      'requestee_id string NOT NULL, ' +
      'head_id string ' +
      ')').run();
    this.db.prepare(
      'CREATE TABLE IF NOT EXISTS accesses (' +
      'access_id string PRIMARY_KEY, ' +
      'created integer NOT NULL, ' +
      'valid boolean NOT NULL, ' +
      'valid_until integer NOT NULL, ' +
      'user_id string NOT NULL ' +
      ')').run();
  }

  close(): void {
    return this.db.close();
  }

}
module.exports = Database;
