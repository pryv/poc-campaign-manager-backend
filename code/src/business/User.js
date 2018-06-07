// @flow

import typeof {Database} from '../database';
import cuid from 'cuid';
import _ from 'lodash';

/**
 * Represents a user in the app, can be linked with a Pryv user
 */
export class User {

  id: string;

  localId:? string;
  username:? string;
  password:? string;

  pryvId:? string;
  pryvUsername:? string;
  pryvToken:? string;

  constructor(params: {
    id?: string,
    localId?: string,
    username?: string,
    password?: string,
    pryvId?: string,
    pryvUsername?: string,
    pryvToken?: string,
  }) {
    if (params == null) {
      params = {};
    }
    this.id = params.id || cuid();
    this.localId = params.localId || null;
    this.username = params.username || null;
    this.password = params.password || null;
    this.pryvId = params.pryvId || null;
    this.pryvUsername = params.pryvUsername || null;
    this.pryvToken = params.pryvToken || null;

    if (this.pryvUsername != null && this.pryvId == null) {
      this.pryvId = cuid();
    }
    if (this.username != null && this.localId == null) {
      this.localId = cuid();
    }
  }

  save(db: Database): User {
    return db.saveUser(this);
  }

  update(params: {
    db: Database,
    update: mixed
  }): User {
    return params.db.updateUser({
      user: this,
      update: _.pick(params.update, ['pryvUsername', 'pryvToken'])
    });
  }

  linkToPryvAccount(params: {
    db: Database,
    pryvParams: {
      pryvUsername: string,
      pryvToken: string,
    }
  }): User {
    this.pryvUsername = params.pryvParams.pryvUsername;
    this.pryvToken = params.pryvParams.pryvToken;
    this.pryvId = cuid();
    return params.db.linkUserToPryvUser({user: this})
  }

  isValidPassword(params: {
    db: Database,
    password: string,
  }): boolean {
    return params.db.getPassword({
      user: this
    }) === params.password;
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

  forApi(params: {
      token: string
  }): mixed {
    const responseFields = _.pick(this, ['id', 'username', 'pryvUsername']);
    return _.defaults(responseFields, { token: params.token});
  }
}