// @flow

import type { Database } from '../database';
const { User } = require('../business');
const errors = require('../errors');

/**
 * If user exists, register the User to reg.params.user,
 *
 *
 * @param req
 * @param res
 * @param next
 * @returns {express$Response}
 */
module.exports = (params: {
  db: Database,
  }) => {
  return (req: express$Request, res: express$Response, next: express$NextFunction) => {
    if(req.params.username === 'all')
      return next();
    const user: User = params.db.users.getOne({
      username: req.params.username
    });
    if (! user) {
      return next(errors.unknownResource({
        details: 'User does not exist.'
      }));
    }
    res.locals.user = user;
    next();
  };
};
