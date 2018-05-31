// @flow

/* global describe, it, before, after*/

import should from 'should';
import {User} from '../../src/business';

describe('User', () => {

  it('when no parameters are provided, should only generate an id', () => {
    const user: User = new User();
    should.exist(user);
    should.exist(user.id);
    should.not.exist(user.username);
    should.not.exist(user.pryvId);
    should.not.exist(user.pryvUsername);
  });

  it('when a username is provided, should only have a username', () => {

    const username = 'bob';
    const user: User = new User({
      username: username
    });
    should.exist(user);
    should.exist(user.id);
    user.username.should.eql(username);
    should.not.exist(user.pryvId);
    should.not.exist(user.pryvUsername);
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
  });

  it('should have all fields when they are provided', () => {
    const username = 'bill';
    const pryvUsername = 'bob';
    const id = 'c3o1n2o3kn1';
    const pryvId = 'ckn1o2k3no1';
    const user: User = new User({
      id: id,
      username: username,
      pryvUsername: pryvUsername,
      pryvId: pryvId
  });
    should.exist(user);
    user.id.should.eql(id);
    user.pryvId.should.eql(pryvId);
    user.username.should.eql(username);
    user.pryvUsername.should.eql(pryvUsername);
  });

});