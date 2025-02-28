/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
// @flow    

class AppError extends Error {
  
  id: string;
  httpCode: number;
  details: string;
  extra: ?Object;

  constructor(params: {
      id: string, 
      httpCode: number, 
      details: string,
      extra?: Object,
  }) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.id = params.id;
    this.httpCode = params.httpCode || 500;
    this.details = params.details;
    this.extra = params.extra;
  }
}
module.exports = AppError;