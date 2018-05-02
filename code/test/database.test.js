// @flow

/* global describe, it, before, after*/

import fs from 'fs';
import should from 'should';
import {Database} from '../src/database';
import {User} from '../src/business/User';

const DB_PATH = 'test.db';

describe('Database', () => {

  const db = new Database({path: DB_PATH});

  before(() => {
    console.log('before', db.getUsers());
  });

  after(() => {
    db.close();
    fs.unlinkSync(DB_PATH);
  });

  describe('Users', () => {

    it('should create a user', () => {
      new User({
        username: 'bob'
      }).save(db);
      let users = db.getUsers();
      console.log('users', users);
      users.should.be.Array();
      users[0].username.should.be.eql('bob');
      users[0].should.have.property('id');
    })
  })
});