// @flow

import typeof {Database} from '../database';
import cuid from 'cuid';

export class User {

  id: string;
  username: string;
  pryvUsername:? string;

  constructor(params: {
    id?: string,
    username: string,
    pryvUsername?: string,
  }) {
    this.id = params.id || cuid();
    this.username = params.username;
    this.pryvUsername = params.pryvUsername;
  }

  save(db: Database): void {
    db.saveUser(this);
  }
}