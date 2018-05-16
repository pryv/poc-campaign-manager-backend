// @flow

const bluebird = require('bluebird');

import typeof sqlite3 from 'better-sqlite3';
import {User} from '../business';
import {Statement} from 'better-sqlite3';

export class Users {

  db: sqlite3;
  saveStatement: Statement;
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
      'username, ' +
      'pryv_username' +
      ') VALUES (' +
      '@user_id, ' +
      '@username, ' +
      '@pryv_username' +
      ');'
    );

    this.getUserByUsernameStatement = this.db.prepare(
      'SELECT * ' +
      'FROM users ' +
      'WHERE username = @username;'
    );

    this.getUserByPryvUsernameStatement = this.db.prepare(
      'SELECT * ' +
      'FROM users ' +
      'WHERE pryv_username = @pryv_username;'
    );
  }

  save(user: User): void {
    this.saveStatement.run({
        user_id: user.id,
        username: user.username,
        pryv_username: user.pryvUsername,
      }
    );
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
      console.log('fetching users with', params)
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
    });
  }
}