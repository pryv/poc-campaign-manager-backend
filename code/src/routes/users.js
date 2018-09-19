// @flow

const Ajv = require('ajv');
const _ = require('lodash');
const bcrypt = require('bcrypt');

import type { Database } from '../database';
const { User } = require('../business');
const getInstance = require('../database').getInstance;
const schema = require('../schemas');
const errors = require('../errors');

const database: Database = getInstance();

const ajv = new Ajv();
const userSchema = ajv.compile(schema.User);

const router = require('express').Router();

router.post('/', async (req: express$Request, res: express$Response, next: express$NextFunction) => {

  try {
    const userObject: any = req.body;

    userSchema(userObject);
    const checkResult = _.cloneDeep(userSchema);

    if (checkResult.errors) {
      return next(errors.invalidRequestStructure({
        details: checkResult.errors,
      }));
    }

    const user = new User(userObject);
    if (user.exists(database)) {
      return next(errors.itemAlreadyExists({
        details: 'Username already taken.',
      }));
    }

    if (user.password != null) {
      user.passwordHash = await bcrypt.hash(user.password, 10);
    }
    
    user.save(database);

    return res.status(201)
      .json({
        user: user
      });
  } catch (e) {
    return next(e);
  }
});

router.get('/:username', (req: express$Request, res: express$Response, next: express$NextFunction) => {

  try {
    const user: User = res.locals.user;

    res.status(200)
      .json({
        user: user.forApi({db: database})
      });
  } catch (e) {
    return next(e);
  }
});

router.put('/:username', (req: express$Request, res: express$Response, next: express$NextFunction) => {

  try {
    const user: User = res.locals.user;
    const updateObject: mixed = req.body;

    userSchema(updateObject);
    const checkResult = _.cloneDeep(userSchema);
    if (checkResult.errors) {
      return next(errors.invalidRequestStructure({
        details: checkResult.errors,
      }));
    }

    const pryvUser: User = database.users.getOne({pryvUsername: updateObject.pryvUsername});

    if (unlinkedPryvUserExists({ pryvUser: pryvUser, localUser: user})) {
      user.mergePryvUser({
        db: database,
        pryvUser: pryvUser,
        pryvToken: updateObject.pryvToken,
      });
    } else if (pryvUserIsAlreadyLinked({ localUser: user })) {
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
  } catch (e) {
    return next(e);
  }
});

module.exports = router;

function unlinkedPryvUserExists(params: {
  pryvUser: User,
  localUser: User,
}): boolean {
  return params.pryvUser != null && params.localUser.pryvId == null;
}

function pryvUserIsAlreadyLinked(params: {
  localUser: User,
}): boolean {
  return params.localUser.pryvUsername != null;
}
