// @flow

const logger: any = require('../logger');

module.exports = (req: express$Request, res: express$Response, next: express$NextFunction): void => {
  logger.info(req.method + ' ' + req.path);
  //console.log(req.method + ' ' + req.path);
  next();
};
