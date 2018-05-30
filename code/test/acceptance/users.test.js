// @flow

/* global describe, it, before, after */

const request: any = require('supertest');
const should: any = require('should');

import _ from 'lodash';

const app: express$Application = require('../../src/app');
const config = require('../../src/config');

import {Fixtures} from '../support/Fixtures';
import {DbCleaner} from '../support/DbCleaner';
import {Database} from '../../src/database';
import {User} from '../../src/business';

const DB_PATH = config.get('database:path');

describe('users', () => {

  let fixtures: Fixtures = new Fixtures();
  let db: Database = new Database({path: DB_PATH});
  let cleaner: DbCleaner = new DbCleaner();

  beforeEach(() => {
    return cleaner.clean();
  });

  after(() => {
    fixtures.close();
    cleaner.close();
  });

  function makeUrl(option:? string): string {
    const base = '/users';
    return option ? base + '/' + option : base;
  }

  describe('when creating a user', () => {

    it('should create a user in the users table, return a 201', () => {

      const user = _.pick(
        fixtures.getUser({appOnly: true}),
        ['username']);

      return request(app)
        .post(makeUrl())
        .send(user)
        .then(res => {
          res.status.should.be.eql(201);
          const createdUser = db.getUser({username: user.username});
          should.exist(createdUser);
          createdUser.username.should.eql(user.username);
        });
    });

    it('should return a 400, if the username is already taken', () => {

      const user: User = fixtures.addUser();

      return request(app)
        .post(makeUrl())
        .send(_.pick(user, ['username', 'password']))
        .then(res => {
          res.status.should.eql(400);
          should.exist(res.error);
        });
    });

  });

  describe('when creating a Pryv user', () => {

    it('should create a user in the pryv_users and users tables, return a 201', () => {

      const user: User = _.pick(fixtures.getUser({pryvOnly: true}),
        ['pryvUsername']);

      return request(app)
        .post(makeUrl())
        .send(user)
        .then(res => {
          res.status.should.eql(201);

          const createdPryvUser = db.getUser({pryvUsername: user.pryvUsername});
          should.exist(createdPryvUser);
          createdPryvUser.pryvUsername.should.eql(user.pryvUsername);
          should.exist(createdPryvUser.id);
          should.exist(createdPryvUser.pryvId);
        })
    });

    it('should return a 400 if the pryv_user already exists', () => {

      const user: User = fixtures.addUser({pryvOnly: true});

      return request(app)
        .post(makeUrl())
        .send({user: user.pryvUsername})
        .then(res => {
          res.status.should.eql(400);
          should.exist(res.error);
        });
    });

  });

  describe('when updating a user account with a Pryv account', () => {

    it('should add a pryv_user pointing to the user account', () => {

      const user: User = fixtures.addUser({appOnly: true});
      const pryvUsername: string = 'bloppp';

      return request(app)
        .put(makeUrl(user.username))
        .send({
          username: user.username,
          pryvUsername: pryvUsername,
        })
        .then(res => {
          res.status.should.eql(200);
          res.body.should.have.property('user');
          const updatedUser = res.body.user;
          updatedUser.username.should.eql(user.username);
          updatedUser.pryvUsername.should.eql(pryvUsername);
          updatedUser.id.should.eql(user.id);
        });
    });

    it('should return a 400 with an error if the schema is not respected', () => {

      const user: User = fixtures.addUser();

      return request(app)
        .put(makeUrl(user.username))
        .send({badField: 'yolo'})
        .then(res => {
          res.status.should.eql(400);
          res.body.should.have.property('error');
        })
    });

    it('should return a 400 with an error if the user does not exist', () => {

      return request(app)
        .put(makeUrl('unexistantUsername'))
        .send({})
        .then(res => {
          res.status.should.eql(400);
          res.body.should.have.property('error');
        });

    });

  });

  describe('when merging accounts', () => {

    it('should delete a user and link its pryv_user to the user\'s account, return a 200');

    it('should return a 400 when the user is missing');

    it('should return a 400 when the pryvUser is missing')

  });

});
