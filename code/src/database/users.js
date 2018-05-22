// @flow

const bluebird = require('bluebird');

import typeof sqlite3 from 'better-sqlite3';
import {User} from '../business';
import {Statement, Transaction} from 'better-sqlite3';

export class Users {

  db: sqlite3;

  saveStatement: Statement;
  saveWithPryvTransaction: Transaction;

  getUserByUsernameStatement: Statement;
  getUserByPryvUsernameStatement: Statement;

  constructor(params: {db: sqlite3}) {
    this.db = params.db;

    this.initStatements();
  }

  initStatements(): void {
    this.saveStatement = this.db.prepare(
      'INSERT INTO users (' +
      'user_id, ' +
      'username ' +
      ') VALUES (' +
      '@user_id, ' +
      '@username ' +
      ');'
    );

    this.saveWithPryvTransaction = this.db.transaction([
        'INSERT INTO users (' +
        'user_id, ' +
        'username' +
        ') VALUES (' +
        '@user_id, ' +
        '@username' +
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

    this.getUserByUsernameStatement = this.db.prepare(
      'SELECT' +
      ' ' +
      'u.user_id, u.username, pu.pryv_user_id, pu.pryv_username' +
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
      'u.user_id, u.username, pu.pryv_user_id, pu.pryv_username' +
      ' ' +
      'FROM pryv_users pu' +
      ' ' +
      'INNER JOIN users u ON pu.user_id = u.user_id' +
      ' ' +
      'WHERE pu.pryv_username = @pryv_username;'
    );
  }

  save(user: User): void {
    if (user.pryvUsername) {
      this.saveWithPryvTransaction.run({
        user_id: user.id,
        username: user.username,
        pryv_user_id: user.pryvId,
        pryv_username: user.pryvUsername,
      });
    } else {
      this.saveStatement.run({
          user_id: user.id,
          username: user.username,
        }
      );
    }
  }

  get(): Array<User> {
    return this.db.prepare(
      'SELECT * FROM users'
    ).all().map(convertFromDB);
  }

  getUser(params: {
    username?: string,
    pryvUsername?: string,
  }): User {

    if (params.username) {
      return convertFromDB(this.getUserByUsernameStatement
        .get({username: params.username}));

    } else if (params.pryvUsername) {
      return convertFromDB(this.getUserByPryvUsernameStatement
        .get({pryv_username: params.pryvUsername}));

    } else {
      throw new Error('please provide a username or pryvUsername');
    }
  }

}

function convertFromDB(user: mixed): User {
  if (user) {

    return new User({
      id: user.user_id,
      username: user.username,
      pryvUsername: user.pryv_username,
      pryvId: user.pryv_user_id,
    });
  }
}