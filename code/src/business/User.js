// @flow

import typeof {Database} from '../database';
import {Access} from '.';
import cuid from 'cuid';
import _ from 'lodash';

/**
 * Represents a user in the app, can be linked with a Pryv user
 */
export class User {

  id: string;

  localId: ?string;
  username: ?string;
  password: ?string;

  pryvId: ?string;
  pryvUsername: ?string;
  pryvToken: ?string;

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
    return db.users.save(this);
  }

  update(params: {
    db: Database,
    update: mixed
  }): User {
    return params.db.users.updateOne({
      user: this,
      update: _.pick(params.update, ['pryvUsername', 'pryvToken'])
    });
  }

  addPryvAccountToUser(params: {
    db: Database,
    pryvParams: {
      pryvUsername: string,
      pryvToken: string,
    }
  }): User {
    this.pryvUsername = params.pryvParams.pryvUsername;
    this.pryvToken = params.pryvParams.pryvToken;
    this.pryvId = cuid();
    return params.db.users.addPryvAccountToUser({user: this});
  }

  updatePryvToken(params: {
    db: Database,
    pryvParams: {
      pryvToken: string,
    }
  }): User {
    this.pryvToken = params.pryvParams.pryvToken;
    return params.db.users.updatePryvToken({user: this});
  }

  mergePryvUser(params: {
    db: Database,
    pryvUser: User,
    pryvToken: string,
  }): User {
    this.pryvId = params.pryvUser.pryvId;
    this.pryvUsername = params.pryvUser.pryvUsername;
    this.pryvToken = params.pryvToken;
    return params.db.users.mergePryvUser({
      user: this,
      pryvUser: params.pryvUser,
    });
  }

  isValidPassword(params: {
    db: Database,
    password: string,
  }): boolean {
    return params.db.users.getPassword({
      user: this
    }) === params.password;
  }

  exists(db: Database): boolean {
    return db.users.getOne(_.pick(this, ['username', 'pryvUsername'])) != null;
  }

  isLinkedWithPryv(params: {
    db: Database
  }): boolean {
    if (this.username != null && this.pryvUsername != null) {
      return (params.db.users.getPryvToken({user: this}) != null);
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
      db: Database,
      token: string
  }): mixed {
    const user = _.pick(this, ['id', 'username', 'pryvUsername']);

    if (this.isLinkedWithPryv({db: params.db})) {
      user.pryvToken = params.db.users.getPryvToken({user: this});
    }
    return user;
  }

  addAccess(params: {
    db: Database,
    access: Access,
  }): Access {
    params.access.save({
      db: params.db,
      user: this,
    });
    return params.access;
  }

  isAccessValid(params: {
    db: Database,
    accessId: string,
  }): boolean {
    const access: Access = params.db.accesses.getOne({
      user: this,
      accessId: params.accessId,
    });

    if (access == null) {
      return false;
    }

    if (! access.isValid) {
      return false;
    }

    return access.isValidUntil > now();
  }

  invalidateAccess(params: {
    db: Database,
    accessId: string,
  }): Access {
    return params.db.accesses.updateOne({
      user: this,
      access: {
        id: params.accessId,
        isValid: false,
      }
    });
  }
}

function now() {
  return Date.now() / 1000;
}