// @flow

import typeof {Database} from '../database';
import typeof {User} from '../business';
import cuid from 'cuid';

export class Access {

  id: string;
  created: number;
  validUntil: number;

  constructor(params: {
    id?: string,
    created?: number,
    validUntil?: number,
  }) {
    if (params == null) {
      params = {};
    }
    this.id = params.id || cuid();
    this.created = params.created || now();
    this.validUntil = params.validUntil || inTwoWeeks();
  }

  save(params: {
    db: Database,
    user: User
  }): void {
    params.db.accesses.save({
      access: this,
      user: params.user
    });
  }
}

function now(): number {
  return Date.now() / 1000;
}

function inTwoWeeks(): number {
  return now() + (60 * 60 * 24 * 14);
}
