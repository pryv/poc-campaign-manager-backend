// @flow

const Ajv = require('ajv');
const _ = require('lodash');

import type { Database } from '../database';

const {User, Access} = require('../business');
const getInstance = require('../database').getInstance;
const schema = require('../schemas');

const database: Database = getInstance();

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

  const user: User = database.users.getOne({username: signInObject.username});
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

  const access: Access = user.addAccess({
    db: database,
    access: new Access()
  });

  const response: mixed = {
    user: user.forApi({db: database})
  };
  response.user.token = access.id;

  res.status(200)
    .json(response);
});

module.exports = router;
