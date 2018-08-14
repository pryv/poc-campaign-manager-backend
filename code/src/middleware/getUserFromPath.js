// @flow

import type { Database } from '../database';
import {User} from '../business';

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
  return (req: express$Request, res: express$Response, next: express$NextFunction): void => {
    const username: string = req.params.username;

    if (username == null) {
      return missingUsername(res);
    }


    const user: User = params.db.users.getOne({
      username: username
    });

    if (user == null) {
      return userNotExists(username, res);
    }

    res.locals.user = user;
    next();
  };
};

function missingUsername(res: express$Response): express$Response {
  return res.status(400)
    .json({
      error: 'Missing username'
    });
}

function userNotExists(username: string, res: express$Response): express$Response {
  return res.status(400)
    .json({
      error: 'User "' + username + '" does not exist.'
    });
}
