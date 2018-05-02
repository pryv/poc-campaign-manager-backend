// @flow

/* global describe, it, before, after*/

import fs from 'fs';
import should from 'should';
import {Database} from '../src/database';
import {User} from '../src/business/User';

const DB_PATH: string = 'test.db';

describe('Database', () => {

  const db: Database = new Database({path: DB_PATH});

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
      users.should.be.Array();
      users[0].username.should.be.eql('bob');
      users[0].should.have.property('id');
    })
  })
});