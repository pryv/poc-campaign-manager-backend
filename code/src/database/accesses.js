// @flow

import typeof sqlite3 from 'better-sqlite3';
import {User, Access} from '../business';
import {Statement} from 'better-sqlite3';

export class Accesses {

  db: sqlite3;

  saveStatement: Statement;
  getStatement: Statement;
  getOneStatement: Statement;
  updateOneStatement: Statement;

  constructor(params: {db: sqlite3}) {
    this.db = params.db;

    this.initStatements();
  }

  initStatements(): void {
    this.saveStatement = this.db.prepare(
      'INSERT INTO accesses (' +
      'access_id, ' +
      'created, ' +
      'valid, ' +
      'valid_until, ' +
      'user_id ' +
      ') VALUES ( ' +
      '@access_id, ' +
      '@created, ' +
      '@valid, ' +
      '@valid_until, ' +
      '@user_id' +
      ');');

    this.getStatement = this.db.prepare(
      'SELECT * ' +
      '' +
      'FROM accesses ' +
      '' +
      ' WHERE user_id=@user_id;');

    this.getOneStatement = this.db.prepare(
      'SELECT * ' +
      '' +
      'FROM accesses ' +
      '' +
      ' WHERE ' +
      '  (user_id=@user_id ' +
      'AND ' +
      '  access_id=@access_id);'
    );

    this.updateOneStatement = this.db.prepare(
      'UPDATE accesses ' +
      ' ' +
      'SET valid=@valid ' +
      ' ' +
      ' WHERE ' +
      '  (access_id=@access_id ' +
      'AND' +
      '  user_id=@user_id);'
    );
  }

  save(params: {
    user: User,
    access: Access,
  }): Access {
    this.saveStatement.run({
      user_id: params.user.id,
      access_id: params.access.id,
      created: params.access.created,
      valid: params.access.isValid ? 1 : 0,
      valid_until: params.access.isValidUntil,
    });
    return params.access;
  };

  get(params: {
    user: User
  }): Array<Access> {
    return this.getStatement.all({
      user_id: params.user.id,
    }).map(convertFromDB);
  }

  getOne(params: {
    user: User,
    accessId: string,
  }): Access {
    return convertFromDB(this.getOneStatement.get({
      user_id: params.user.id,
      access_id: params.accessId,
    }));
  };

  updateOne(params: {
    user: User,
    access: Access,
  }): Access {
    this.updateOneStatement.run({
      user_id: params.user.id,
      access_id: params.access.id,
      valid: params.access.isValid ? 1 : 0,
    });
    return params.access;
  };
}

function convertFromDB(result: mixed): Access {
  if (result == null) {
    return null;
  }
  return new Access({
    id: result.access_id,
    created: result.created,
    isValidUntil: result.valid_until,
    isValid: convertBoolean(result.valid),
  });
}

function convertBoolean(integerBoolean: integer): boolean {
  if (integerBoolean === 1) {
    return true;
  } else {
    return false;
  }
}