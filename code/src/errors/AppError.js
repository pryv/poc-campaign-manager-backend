// @flow    

class AppError extends Error {
  
  id: string;
  httpCode: number;
  details: string;

  constructor(params: {
      id: string, 
      httpCode: number, 
      details: string
  }) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.id = params.id;
    this.httpCode = params.httpCode || 500;
    this.details = params.details;
  }
}
module.exports = AppError;