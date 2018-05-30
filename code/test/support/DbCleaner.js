// @flow

const knexCleaner = require('knex-cleaner');
const config = require('../../src/config');

export class DbCleaner {

  knex: mixed;

  constructor() {
    this.knex = require('knex')({
      client: 'sqlite3',
      connection: ':memory:',
      useNullAsDefault: true // removes warning
    });
  }

  clean(): Promise<mixed> {
    return knexCleaner.clean(this.knex);
  }

  close(): void {
    return this.knex.destroy();
  }
}



