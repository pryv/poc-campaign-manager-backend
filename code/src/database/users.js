// @flow

const bluebird = require('bluebird');

import typeof sqlite3 from 'better-sqlite3';
import {User} from '../business/User';
import {Transaction} from 'better-sqlite3';

export class Users {

  db: sqlite3;
  saveStatement: Transaction;

  constructor(params: {db: sqlite3}) {
    this.db = params.db;

    this.initStatements();
  }

  initStatements(): void {
    this.saveStatement = this.db.prepare(
      'INSERT INTO users (' +
      'user_id, ' +
      'username' +
      ') VALUES (' +
      '@user_id, ' +
      '@username' +
      ');'
    );
  }

  save(user: User): void {
    this.saveStatement.run({
        user_id: user.id,
        username: user.username
      }
    );
  }

  get(): Array<User> {
    return this.db.prepare(
      'SELECT * FROM users'
    ).all().map(convertFromDB);
  }

}

function convertFromDB(user: mixed): User {
  return new User({
    id: user.user_id,
    username: user.username
  });
}