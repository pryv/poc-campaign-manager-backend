// @flow

const bluebird = require('bluebird');

import typeof sqlite3 from 'better-sqlite3';
import {User} from '../business';
import {Statement, Transaction} from 'better-sqlite3';

export class Users {

  db: sqlite3;

  saveWithPryvTransaction: Transaction;
  saveWithLocalTransaction: Transaction;
  saveWithBothTransaction: Transaction;

  getUserByIdStatement: Statement;
  getUserByUsernameStatement: Statement;
  getUserByPryvUsernameStatement: Statement;
  getUserByPryvIdStatement: Statement;

  linkPryvUserToUserStatement: Statement;
  addPryvUserToUserStatement: Statement;

  getPasswordStatement: Statement;

  constructor(params: {db: sqlite3}) {
    this.db = params.db;

    this.initStatements();
  }

  initStatements(): void {

    this.saveWithPryvTransaction = this.db.transaction([
      'INSERT INTO users (' +
      'user_id ' +
      ') VALUES (' +
      '@user_id ' +
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

    this.saveWithLocalTransaction = this.db.transaction([
      'INSERT INTO users (' +
      'user_id ' +
      ') VALUES (' +
      '@user_id ' +
      ');',
      'INSERT INTO local_users (' +
      'local_user_id, ' +
      'username, ' +
      'password, ' +
      'user_id' +
      ') VALUES (' +
      '@local_user_id, ' +
      '@username, ' +
      '@password, ' +
      '@user_id' +
      ');'
    ]);

    this.saveWithBothTransaction = this.db.transaction([
      'INSERT INTO users (' +
      'user_id ' +
      ') VALUES (' +
      '@user_id' +
      ');',
      'INSERT INTO local_users (' +
      'local_user_id, ' +
      'username, ' +
      'password, ' +
      'user_id' +
      ') VALUES (' +
      '@local_user_id, ' +
      '@username, ' +
      '@password, ' +
      '@user_id' +
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
      'u.user_id, lu.local_user_id, lu.username, pu.pryv_user_id, pu.pryv_username' +
      ' ' +
      'FROM users u ' +
      ' ' +
      'LEFT OUTER JOIN pryv_users pu ON u.user_id = pu.user_id ' +
      'LEFT OUTER JOIN local_users lu ON u.user_id = lu.user_id ' +
      ' ' +
      'WHERE u.user_id = @user_id;'
    );

    this.getUserByUsernameStatement = this.db.prepare(
      'SELECT' +
      ' ' +
      'lu.user_id, lu.local_user_id, lu.username, pu.pryv_user_id, pu.pryv_username' +
      ' ' +
      'FROM local_users lu' +
      ' ' +
      'LEFT OUTER JOIN pryv_users pu ON lu.user_id = pu.user_id ' +
      ' ' +
      'WHERE lu.username = @username;'
    );

    this.getUserByPryvUsernameStatement = this.db.prepare(
      'SELECT' +
      ' ' +
      'u.user_id, lu.local_user_id, lu.username, pu.pryv_user_id, pu.pryv_username' +
      ' ' +
      'FROM pryv_users pu' +
      ' ' +
      'LEFT JOIN users u ON pu.user_id = u.user_id ' +
      'LEFT JOIN local_users lu ON pu.user_id = lu.user_id ' +
      ' ' +
      'WHERE pu.pryv_username = @pryv_username;'
    );

    this.getUserByPryvIdStatement = this.db.prepare(
      'SELECT' +
      ' ' +
      'u.user_id, lu.username, pu.pryv_user_id, pu.pryv_username' +
      ' ' +
      'FROM pryv_users pu' +
      ' ' +
      'LEFT JOIN users u ON pu.user_id = u.user_id ' +
      'LEFT JOIN local_users lu ON pu.user_id = lu.user_id ' +
      ' ' +
      'WHERE pu.pryv_user_id = @pryv_id;'
    );

    // TODO: remove when merging is implemented and some use cases are figured out.
    this.linkPryvUserToUserStatement = this.db.prepare(
      'UPDATE pryv_users ' +
      '' +
      'SET ' +
      ' user_id = @user_id ' +
      '' +
      'WHERE' +
      ' pryv_username = @pryv_username'
    );

    this.addPryvUserToUserStatement = this.db.prepare(
      'INSERT INTO pryv_users (' +
      'pryv_user_id, ' +
      'pryv_username, ' +
      'pryv_token, ' +
      'user_id ' +
      ') VALUES ( ' +
      '@pryv_user_id, ' +
      '@pryv_username, ' +
      '@pryv_token, ' +
      '@user_id ' +
      ');'
    );

    this.getPasswordStatement = this.db.prepare(
      'SELECT ' +
      ' lu.password ' +
      'FROM ' +
      ' local_users lu ' +
      'WHERE ' +
      ' lu.username = @username'
    );
  }

  save(user: User): User {
    if (user.pryvUsername && user.username) {
      this.saveWithBothTransaction.run({
        user_id: user.id,
        username: user.username,
        password: user.password,
        pryv_user_id: user.pryvId,
        pryv_username: user.pryvUsername,
        local_user_id: user.localId,
      })
    } else if (user.pryvUsername) {
      this.saveWithPryvTransaction.run({
        user_id: user.id,
        username: user.username,
        password: user.password,
        pryv_user_id: user.pryvId,
        pryv_username: user.pryvUsername,
      });
    } else {
      this.saveWithLocalTransaction.run({
          user_id: user.id,
          local_user_id: user.localId,
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
      'SELECT ' +
      ' ' +
      'u.user_id, lu.local_user_id, lu.username, pu.pryv_user_id, pu.pryv_username ' +
      '' +
      ' FROM users u' +
      '' +
      ' LEFT JOIN local_users lu ON u.user_id = lu.user_id' +
      ' ' +
      ' LEFT JOIN pryv_users pu ON u.user_id = pu.user_id;'
    ).all().map(convertFromDB);
  }

  getOne(params: {
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

  updateOne(params: {
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

  addPryvUser(params: {user: User}): User {
    this.addPryvUserToUserStatement.run({
      pryv_username: params.user.pryvUsername,
      pryv_token: params.user.pryvToken,
      pryv_user_id: params.user.pryvId,
      user_id: params.user.id,
    });
    return params.user;
  }

}

function convertFromDB(result: mixed): User {
  if (result) {
    const createdUser = new User({
      id: result.user_id,
      username: result.username,
      pryvUsername: result.pryv_username,
      pryvId: result.pryv_user_id,
      localId: result.local_user_id,
    });
    if (result.password) {
      createdUser.password = result.password;
    }
    return createdUser;
  }
}