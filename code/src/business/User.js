// @flow

import typeof {Database} from '../database';
import cuid from 'cuid';

export class User {

  id: string;
  username: string;

  constructor(params: {
    id?: string,
    username: string
  }) {
    this.id = params.id || cuid();
    this.username = params.username;
  }

  save(db: Database): void {
    db.saveUser(this);
  }
}