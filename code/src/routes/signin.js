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
const signInSchema = ajv.compile(schema.User);

const router = require('express').Router();

router.post('/', (req: express$Request, res: express$Response) => {

  const signInObject: any = req.body;

  signInSchema(signInObject);
  const checkResult = _.cloneDeep(signInSchema);

  if (checkResult.errors) {
    return res.status(400)
      .json({
        error: 'wrong schema',
        details: checkResult.errors
      });
  }

  const user = new User(signInObject);
  if (! user.exists(database)) {
    return res.status(400)
      .json({
        error: 'wrong username or password',
        details: signInObject
      });
  }

  const isValidPassword = user.isValidPassword({
    db: database,
    password: signInObject.password
  });

  if (isValidPassword) {
    return res.status(200)
      .json({
        user: user.forApi({
          token: generateToken()
        })
      });
  } else {
    return res.status(400)
      .json({
        error: 'wrong username or password',
        details: signInObject
      });
  }
});

function generateToken() {
  return 'abc';
}

module.exports = router;
