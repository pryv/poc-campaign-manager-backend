// @flow

const sqlite3 = require('better-sqlite3');
const config = require('../../src/config');

export class DbCleaner {

  db: mixed;
  deleteDataTransaction: Transaction;

  constructor() {
    this.db = new sqlite3(config.get('database:path'), config.get('database:options'));

    this.initTransaction();
  }

  initTransaction(): void {
    this.deleteDataTransaction = this.db.transaction([
      'DELETE FROM invitations',
      'DELETE FROM campaigns',
      'DELETE FROM pryv_users',
      'DELETE FROM users',
    ]);
  }

  clean(): void {
    this.deleteDataTransaction.run();
  }

}



