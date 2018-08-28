// @flow

import type {Database} from '../database';
import type {User} from '../business';

const cuid = require('cuid');

class Access {

  id: string;
  created: number;
  isValidUntil: number;
  isValid: boolean;

  constructor(params?: {
    id?: string,
    created?: number,
    isValidUntil?: number,
    isValid?: boolean,
  }) {
    if (params == null) {
      params = {};
    }
    this.id = params.id || cuid();
    this.created = params.created || now();
    this.isValidUntil = params.isValidUntil || inTwoWeeks();
    if (params.isValid == null) {
      this.isValid = true;
    } else {
      this.isValid = params.isValid;
    }
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
module.exports = Access;

function now(): number {
  return Date.now() / 1000;
}

function inTwoWeeks(): number {
  return now() + (60 * 60 * 24 * 14);
}
