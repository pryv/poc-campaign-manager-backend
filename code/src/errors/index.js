// @flow

const AppError = require('./AppError');

const errors = {};
module.exports = errors;

errors.AppError = AppError;

errors.invalidRequestStructure = function (params: {
  details: string
}): AppError {
  return new AppError({
    id: 'Invalid request structure',
    httpCode: 400,
    details: params.details,
  });
};

errors.forbidden = function (params: {
  details: string
}): AppError {
  return new AppError({
    id: 'Forbidden',
    httpCode: 403,
    details: params.details,
  });
};

errors.invalidCredentials = function (params: {
  details: string,
}): AppError {
  return new AppError({
    id: 'Invalid credentials',
    httpCode: 401,
    details: params.details,
  });
};

errors.unknownResource = function (params: {
  details: string,
}): AppError {
  return new AppError({
    id: 'Unknown resource',
    httpCode: 404,
    details: params.details,
  });
}