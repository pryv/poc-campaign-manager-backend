// @flow

import typeof {Database} from '../database';
import cuid from 'cuid';
import _ from 'lodash';

/**
 * Represents a user in the app, can be linked with a Pryv user
 */
export class User {

  id: string;
  username:? string;
  pryvId:? string;
  pryvUsername:? string;

  constructor(params: {
    id?: string,
    username?: string,
    pryvId?: string,
    pryvUsername?: string,
  }) {
    if (params == null) {
      params = {};
    }
    this.id = params.id || cuid();
    this.username = params.username || null;
    this.pryvId = params.pryvId || null;
    this.pryvUsername = params.pryvUsername || null;

    if (this.pryvUsername != null && this.pryvId == null) {
      this.pryvId = cuid();
    }
  }

  save(db: Database): void {
    db.saveUser(this);
  }

  exists(db: Database): boolean {
    return db.getUser(_.pick(this, ['username', 'pryvUsername'])) != null;
  }

  isLinkedWithPryv(): boolean {
    if (this.username != null && this.pryvUsername != null) {
      return true;
    } else {
      return false;
    }
  }

  isPryvOnly(): boolean {
    if (this.username == null && this.pryvUsername != null) {
      return true;
    } else {
      return false;
    }
  }
}