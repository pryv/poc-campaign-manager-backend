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
const signInSchema = ajv.compile(schema.SignIn);

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

  const user: User = database.getUser({username: signInObject.username});
  if (user == null) {
    return res.status(400)
      .json({
        error: 'wrong username or password',
      });
  }

  const isValidPassword: boolean = user.isValidPassword({
    db: database,
    password: signInObject.password
  });

  if (! isValidPassword) {
    return res.status(400)
      .json({
        error: 'wrong username or password',
      });
  }

  const response: mixed = {
    user: user.forApi({db: database})
  };
  response.user.token = generateToken();

  res.status(200)
    .json(response);
});

function generateToken() {
  return 'abc';
}

module.exports = router;
