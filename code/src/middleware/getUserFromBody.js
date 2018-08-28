// @flow

import type { Database } from '../database';
const {User} = require('../business');
const errors = require('../errors');

/**
 * If user exists, register the User to res.locals.user,
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
    const body: mixed = req.body;
    if (body.user == null || body.user.username == null) {
      return next(errors.invalidRequestStructure({
        details: 'Missing username',
      }));
    }

    const username: string = body.user.username;
    const user: User = params.db.users.getOne({
      username: username
    });

    if (user == null) {
      return next(errors.unknownResource({
        details: 'User "' + username + '" does not exist.',
      }));
    }

    res.locals.user = user;
    next();
  };
};
