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

module.exports = router;
