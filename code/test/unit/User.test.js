// @flow

/* global describe, it, before, after*/

import should from 'should';
import {User} from '../../src/business';
import {Fixtures} from '../support/Fixtures';
import {DbCleaner} from '../support/DbCleaner';
import {checkUsers} from '../support/validation';
import {Database} from '../../src/database';

const config = require('../../src/config');

describe('User', () => {

  let fixtures: Fixtures = new Fixtures();
  let db: Database = new Database({path: config.get('database:path')});
  let cleaner: DbCleaner = new DbCleaner();

  beforeEach(() => {
    return cleaner.clean();
  });

  after(() => {
    fixtures.close();
  });

  it('when no parameters are provided, should only generate an id', () => {
    const user: User = new User();
    should.exist(user);
    should.exist(user.id);
    should.not.exist(user.username);
    should.not.exist(user.pryvId);
    should.not.exist(user.localId);
    should.not.exist(user.pryvUsername);
    should.not.exist(user.password);
  });

  it('when a username is provided, should only have a username and localId', () => {

    const username = 'bob';
    const user: User = new User({
      username: username
    });
    should.exist(user);
    should.exist(user.id);
    should.exist(user.localId);
    user.username.should.eql(username);
    should.not.exist(user.pryvId);
    should.not.exist(user.pryvUsername);
    should.not.exist(user.password);
  });

  it('when a pryv username is provided, should have a pryvUsername and id, but no username', () => {
    const pryvUsername = 'bob';
    const user: User = new User({
      pryvUsername: pryvUsername
    });
    should.exist(user);
    should.exist(user.id);
    should.exist(user.pryvId);
    user.pryvUsername.should.eql(pryvUsername);
    should.not.exist(user.username);
    should.not.exist(user.localId);
    should.not.exist(user.password);
  });

  it('should have all fields when they are provided', () => {
    const username = 'bill';
    const pryvUsername = 'bob';
    const id = 'c3o1n2o3kn1';
    const pryvId = 'ckn1o2k3no1';
    const password = 'n1o2kn3oin';
    const localId = '1nok2noin3o';
    const user: User = new User({
      id: id,
      username: username,
      pryvUsername: pryvUsername,
      pryvId: pryvId,
      password: password,
      localId: localId,
  });
    should.exist(user);
    user.id.should.eql(id);
    user.pryvId.should.eql(pryvId);
    user.username.should.eql(username);
    user.pryvUsername.should.eql(pryvUsername);
    user.localId.should.eql(localId);
    user.password.should.eql(password);
  });

  it('should add the Pryv user to the local user', () => {
    const user: User = fixtures.addUser({localOnly: true});
    const pryvUsername = 'testuser';
    const pryvToken = 'coi1n23oi1n2';

    user.linkToPryvAccount({
      db: db,
      pryvParams: {
        pryvUsername: pryvUsername,
        pryvToken: pryvToken,
      }
    });

    const linkedUser: User = db.getUser({pryvUsername});

    // because db.getUser() does not return the pryvToken
    linkedUser.pryvToken = pryvToken;

    checkUsers(user, linkedUser);

  });

});