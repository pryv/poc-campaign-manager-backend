// @flow

const AppError = require('./AppError');
const errorNames: { [string]: string } = require('./errorNames');

const errors = {};
module.exports = errors;

errors.AppError = AppError;
errors.errorNames = errorNames;

errors.invalidRequestStructure = function (params: {
  details: string
}): AppError {
  return new AppError({
    id: errorNames.invalidRequestStructure,
    httpCode: 400,
    details: params.details,
  });
};

errors.forbidden = function (params: {
  details: string
}): AppError {
  return new AppError({
    id: errorNames.forbidden,
    httpCode: 403,
    details: params.details,
  });
};

errors.invalidCredentials = function (params: {
  details: string,
}): AppError {
  return new AppError({
    id: errorNames.invalidCredentials,
    httpCode: 401,
    details: params.details,
  });
};

errors.unknownResource = function (params: {
  details: string,
}): AppError {
  return new AppError({
    id: errorNames.unknownResource,
    httpCode: 404,
    details: params.details,
  });
};