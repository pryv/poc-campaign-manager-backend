// @flow

import type { Database } from '../database';
const {User} = require('../business');

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
    if(req.params.username === 'all')
      return next();

    const user: User = res.locals.user;
    const token: string = req.headers.authorization;

    const isAccessValid = user.isAccessValid({
      db: params.db,
      accessId: token,
    });

    if (! isAccessValid) {
      return res.status(401)
        .json({
          error: 'invalid token',
          details: 'token: "' + token + '"',
        });
    }

    next();
  };
};
