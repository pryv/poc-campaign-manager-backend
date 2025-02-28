/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
// @flow

import type sqlite3 from 'better-sqlite3';
import type {Statement, Transaction} from 'better-sqlite3';

const {User} = require('../business');

class Users {

  db: sqlite3;

  saveWithPryvTransaction: Transaction;
  saveWithLocalTransaction: Transaction;
  saveWithBothTransaction: Transaction;

  getUserByIdStatement: Statement;
  getUserByUsernameStatement: Statement;
  getUserByPryvUsernameStatement: Statement;
  getUserByPryvIdStatement: Statement;

  linkPryvUserToUserTransaction: Transaction;
  addPryvUserToUserStatement: Statement;
  updatePryvTokenStatement: Statement;

  getPasswordStatement: Statement;
  getPryvTokenStatement: Statement;

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
      'pryv_token, ' +
      'user_id' +
      ') VALUES (' +
      '@pryv_user_id, ' +
      '@pryv_username, ' +
      '@pryv_token, ' +
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
      'pryv_token, ' +
      'user_id' +
      ') VALUES (' +
      '@pryv_user_id, ' +
      '@pryv_username, ' +
      '@pryv_token, ' +
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

    this.linkPryvUserToUserTransaction = this.db.transaction([
      'UPDATE invitations ' +
      ' ' +
      'SET ' +
      ' requestee_id = @new_id ' +
      ' ' +
      'WHERE ' +
      ' requestee_id = @old_id;',

      'UPDATE pryv_users ' +
      ' ' +
      'SET ' +
      ' user_id = @new_id,' +
      ' pryv_token = @pryv_token ' +
      ' ' +
      'WHERE ' +
      ' user_id = @old_id;',

      'DELETE ' +
      ' ' +
      'FROM users' +
      ' ' +
      'WHERE ' +
      ' user_id = @old_id;'
    ]);

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

    this.updatePryvTokenStatement = this.db.prepare(
      'UPDATE pryv_users ' +
      ' ' +
      'SET pryv_token = @pryv_token ' +
      ' ' +
      'WHERE pryv_username = @pryv_username;'
    );

    this.getPasswordStatement = this.db.prepare(
      'SELECT ' +
      ' lu.password ' +
      'FROM ' +
      ' local_users lu ' +
      'WHERE ' +
      ' lu.username = @username'
    );

    this.getPryvTokenStatement = this.db.prepare(
      'SELECT ' +
      ' pu.pryv_token ' +
      'FROM ' +
      ' pryv_users pu ' +
      'WHERE ' +
      ' pu.pryv_username = @pryv_username;'
    );
  }

  save(user: User): User {
    if (user.pryvUsername && user.username) {
      this.saveWithBothTransaction.run({
        user_id: user.id,
        username: user.username,
        password: user.passwordHash,
        pryv_user_id: user.pryvId,
        pryv_username: user.pryvUsername,
        local_user_id: user.localId,
        pryv_token: user.pryvToken,
      });
    } else if (user.pryvUsername) {
      this.saveWithPryvTransaction.run({
        user_id: user.id,
        username: user.username,
        password: user.passwordHash,
        pryv_user_id: user.pryvId,
        pryv_username: user.pryvUsername,
        pryv_token: user.pryvToken,
      });
    } else {
      this.saveWithLocalTransaction.run({
        user_id: user.id,
        local_user_id: user.localId,
        username: user.username,
        password: user.passwordHash,
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

  getPryvToken(params: {
     user: User
  }): string {
    const result = this.getPryvTokenStatement
      .get({
        pryv_username: params.user.pryvUsername,
      });
    if (result != null) {
      return result.pryv_token;
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

  addPryvAccountToUser(params: {user: User}): User {
    this.addPryvUserToUserStatement.run({
      pryv_username: params.user.pryvUsername,
      pryv_token: params.user.pryvToken,
      pryv_user_id: params.user.pryvId,
      user_id: params.user.id,
    });
    return params.user;
  }

  updatePryvToken(params: {user: User}): User {
    this.updatePryvTokenStatement.run({
      pryv_username: params.user.pryvUsername,
      pryv_token: params.user.pryvToken,
    });
    return params.user;
  }

  mergePryvUser(params: {
    user: User,
    pryvUser: User,
  }): User {
    this.linkPryvUserToUserTransaction.run({
      pryv_username: params.user.pryvUsername,
      pryv_token: params.user.pryvToken,
      old_id: params.pryvUser.id,
      new_id: params.user.id,
    });
    return params.user;
  }

}
module.exports = Users;

function convertFromDB(result: mixed): User {
  if (result) {
    const createdUser = new User({
      id: result.user_id,
      username: result.username,
      pryvUsername: result.pryv_username,
      pryvId: result.pryv_user_id,
      localId: result.local_user_id,
    });
    return createdUser;
  }
}