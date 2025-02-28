/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
// @flow

import type { Transaction } from 'better-sqlite3';

const sqlite3 = require('better-sqlite3');
const config = require('../../src/config');

class DbCleaner {

  db: any;
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
      'DELETE FROM local_users',
      'DELETE FROM accesses',
      'DELETE FROM users',
    ]);
  }

  clean(): void {
    this.deleteDataTransaction.run();
  }

}
module.exports = DbCleaner;


