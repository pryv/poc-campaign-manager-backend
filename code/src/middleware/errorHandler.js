/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
// @flow

const _ = require('lodash');

const logger: any = require('../logger');
const { AppError } = require('../errors');

module.exports = (error: AppError, req: express$Request, res: express$Response, next: express$NextFunction) => {
  if (error instanceof AppError) {
    logger.error(error.id + ' error (' + error.httpCode + '): ' + error.details);
    let errorBody = {
      error: {
        id: error.id,
        details: error.details
      }
    };
    if (error.extra != null) {
      errorBody = _.defaults(errorBody, error.extra);
    }
    res.status(error.httpCode)
      .json(errorBody);
  } else {
    logger.error('Unexpected error (' + error.message + ')');
    logger.error(error.stack);
    res.status(500)
      .json({
        id: 'Undexpected error',
        details: 'whoops, something went wrong.'
      });
  }
  return next();
};
