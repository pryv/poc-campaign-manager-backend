// @flow

import type { Database } from '../database';
const {User} = require('../business');
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
  return (req: express$Request, res: express$Response, next: express$NextFunction): mixed => {

    const user: User = res.locals.user;

    if (req.headers == null || req.headers.authorization == null) {
      return next(errors.invalidCredentials({
        details: 'Missing token.',
      }));
    }

    const token: string = req.headers.authorization;

    const isAccessValid = user.isAccessValid({
      db: params.db,
      accessId: token,
    });

    if (! isAccessValid) {
      return next(errors.forbidden({
        details: 'The given access token does not grant permission for this operation.',
      }));
    }

    next();
  };
};
