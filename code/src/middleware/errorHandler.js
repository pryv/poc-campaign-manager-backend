// @flow

const logger: any = require('../logger');

const { AppError } = require('../errors');

module.exports = (error: AppError, req: express$Request, res: express$Response, next: express$NextFunction) => {
  if (error instanceof AppError) {
    const msg: string = error.id + ' error (' + error.httpCode + '): ' + error.details;
    logger.error(msg);
    res.status(error.httpCode)
      .json({
        error: {
          id: error.id,
          details: error.details
        }
      });
  } else {
    logger.error('Unexpected error (' + error.httpCode + ')');
    res.status(500)
      .json({
        id: 'Undexpected error',
        details: 'whoops, something went wrong.'
      });
  }
  return next();
};
