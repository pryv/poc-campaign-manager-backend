/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
// @flow

const logger: any = require('../logger');

module.exports = (req: express$Request, res: express$Response, next: express$NextFunction): void => {
  logger.info(req.method + ' ' + req.path);
  next();
};
