// @flow

const bluebird = require('bluebird');

import typeof sqlite3 from 'better-sqlite3';
import {User} from '../business/User';

export class Users {

  db: sqlite3;

  constructor(params: {db: sqlite3}) {
    this.db = params.db;
  }

  save(user: User): void {
    this.db.prepare(
      'INSERT INTO users (' +
      'user_id, ' +
      'username' +
      ') VALUES (\'' +
      user.id + '\', \'' +
      user.username +
      '\');'
    ).run();
  }

  get() {
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