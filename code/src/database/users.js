// @flow

const bluebird = require('bluebird');

import typeof sqlite3 from 'better-sqlite3';
import {User} from '../business';
import {Statement, Transaction} from 'better-sqlite3';

export class Users {

  db: sqlite3;

  saveStatement: Statement;
  saveWithPryvTransaction: Transaction;

  getUserByIdStatement: Statement;
  getUserByUsernameStatement: Statement;
  getUserByPryvUsernameStatement: Statement;
  getUserByPryvIdStatement: Statement;

  linkPryvUserToUserStatement: Statement;

  getPasswordStatement: Statement;

  constructor(params: {db: sqlite3}) {
    this.db = params.db;

    this.initStatements();
  }

  initStatements(): void {
    this.saveStatement = this.db.prepare(
      'INSERT INTO users (' +
      'user_id, ' +
      'username,' +
      'password ' +
      ') VALUES (' +
      '@user_id, ' +
      '@username,' +
      '@password ' +
      ');'
    );

    this.saveWithPryvTransaction = this.db.transaction([
        'INSERT INTO users (' +
        'user_id, ' +
        'username, ' +
        'password ' +
        ') VALUES (' +
        '@user_id, ' +
        '@username, ' +
        '@password ' +
        ');',
        'INSERT INTO pryv_users (' +
        'pryv_user_id, ' +
        'pryv_username, ' +
        'user_id' +
        ') VALUES (' +
        '@pryv_user_id, ' +
        '@pryv_username, ' +
        '@user_id' +
        ');'
    ]);

    this.getUserByIdStatement = this.db.prepare(
      'SELECT ' +
      ' ' +
      'u.user_id, u.username, u.password, pu.pryv_user_id, pu.pryv_username' +
      ' ' +
      'FROM users u ' +
      ' ' +
      'LEFT OUTER JOIN pryv_users pu ON u.user_id = pu.user_id ' +
      ' ' +
      'WHERE u.user_id = @user_id;'
    );

    this.getUserByUsernameStatement = this.db.prepare(
      'SELECT' +
      ' ' +
      'u.user_id, u.username, u.password, pu.pryv_user_id, pu.pryv_username' +
      ' ' +
      'FROM users u' +
      ' ' +
      'LEFT OUTER JOIN pryv_users pu ON u.user_id = pu.user_id' +
      ' ' +
      'WHERE u.username = @username;'
    );

    this.getUserByPryvUsernameStatement = this.db.prepare(
      'SELECT' +
      ' ' +
      'u.user_id, u.username, u.password, pu.pryv_user_id, pu.pryv_username' +
      ' ' +
      'FROM pryv_users pu' +
      ' ' +
      'INNER JOIN users u ON pu.user_id = u.user_id' +
      ' ' +
      'WHERE pu.pryv_username = @pryv_username;'
    );

    this.getUserByPryvIdStatement = this.db.prepare(
      'SELECT' +
      ' ' +
      'u.user_id, u.username, u.password, pu.pryv_user_id, pu.pryv_username' +
      ' ' +
      'FROM pryv_users pu' +
      ' ' +
      'INNER JOIN users u ON pu.user_id = u.user_id' +
      ' ' +
      'WHERE pu.pryv_user_id = @pryv_id;'
    );

    this.linkPryvUserToUserStatement = this.db.prepare(
      'UPDATE pryv_users ' +
      '' +
      'SET ' +
      ' user_id = @user_id ' +
      '' +
      'WHERE' +
      ' pryv_username = @pryv_username'
    );

    this.getPasswordStatement = this.db.prepare(
      'SELECT ' +
      ' u.password ' +
      'FROM ' +
      ' users u ' +
      'WHERE ' +
      ' u.username = @username'
    );
  }

  save(user: User): User {
    if (user.pryvUsername) {
      this.saveWithPryvTransaction.run({
        user_id: user.id,
        username: user.username,
        password: user.password,
        pryv_user_id: user.pryvId,
        pryv_username: user.pryvUsername,
      });
    } else {
      this.saveStatement.run({
          user_id: user.id,
          username: user.username,
          password: user.password,
        }
      );
    }
    return user;
  }

  getPassword(params: {
    user: User
  }): string {
    const result = this.getPasswordStatement
      .get({
        username: params.user.username,
      });
    if (result != null) {
      return result.password;
    } else {
      return null;
    }
  }

  get(): Array<User> {
    return this.db.prepare(
      'SELECT * FROM users'
    ).all().map(convertFromDB);
  }

  getUser(params: {
    id?: string,
    username?: string,
    pryvUsername?: string,
    pryv_id?: string,
  }): User {

    if (params.id) {
      return convertFromDB(this.getUserByIdStatement
        .get({user_id: params.id}));

    } else if (params.username) {
      return convertFromDB(this.getUserByUsernameStatement
        .get({username: params.username}));

    } else if (params.pryvUsername) {
      return convertFromDB(this.getUserByPryvUsernameStatement
        .get({pryv_username: params.pryvUsername}));

    } else if (params.pryv_id) {
      return convertFromDB(this.getUserByPryvIdStatement
        .get({pryv_id: params.pryv_id}));

    } else {
      throw new Error('please provide an id,username, pryvUsername or pryv_id');
    }
  }

  update(params: {
    user: User,
    update: mixed
  }): User {
    this.linkPryvUserToUserStatement.run({
      pryv_username: params.update.pryvUsername,
      user_id: params.user.id,
    });
    params.user.pryvUsername = params.update.pryvUsername;
    return params.user;
  }

}

function convertFromDB(user: mixed): User {
  if (user) {
    return new User({
      id: user.user_id,
      username: user.username,
      pryvUsername: user.pryv_username,
      pryvId: user.pryv_user_id,
      password: user.password,
    });
  }
}