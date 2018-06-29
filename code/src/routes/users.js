// @flow

import Ajv from 'ajv';
import _ from 'lodash';

const logger: any = require('../logger');
import {Database} from '../database';
import {User} from '../business';
const config = require('../config');

import schema from '../schemas';

const database: Database = new Database({
  path: config.get('database:path')
});

const ajv = new Ajv();
const userSchema = ajv.compile(schema.User);

const router = require('express').Router();

router.post('/', (req: express$Request, res: express$Response) => {

  const userObject: any = req.body;

  userSchema(userObject);
  const checkResult = _.cloneDeep(userSchema);

  if (checkResult.errors) {
    return res.status(400)
      .json({
        error: 'wrong schema',
        details: checkResult.errors
      });
  }

  const user = new User(userObject);
  if (user.exists(database)) {
    return res.status(400)
      .json({
        error: 'user already exists',
        details: userObject
      });
  }

  user.save(database);

  return res.status(201)
    .json({
      user: user
    });
});

router.get('/:username', (req: express$Request, res: express$Response) => {

  // check token validity
  const token = req.headers.authorization;

  let user: User = res.locals.user;
  user = user.forApi({db: database});
  res.status(200)
    .json({
      user: user
    });

});

router.put('/:username', (req: express$Request, res: express$Response) => {

  const user: User = res.locals.user;
  const updateObject: mixed = req.body;

  userSchema(updateObject);
  const checkResult = _.cloneDeep(userSchema);
  if (checkResult.errors) {
    return res.status(400)
      .json({
        error: 'wrong schema',
        details: checkResult.errors,
      });
  }

  const pryvUser: User = database.users.getOne({pryvUsername: updateObject.pryvUsername});

  if (pryvUser != null && user.pryvId == null) {
    user.mergePryvUser({
      db: database,
      pryvUser: pryvUser,
      pryvToken: updateObject.pryvToken,
    });
  } else if (user.pryvUsername) {
    user.updatePryvToken({
      db: database,
      pryvParams: updateObject,
    });
  } else {
    user.addPryvAccountToUser({
      db: database,
      pryvParams: updateObject,
    });
  }

  return res.status(200)
    .json({
      user: user
    });

});

module.exports = router;
