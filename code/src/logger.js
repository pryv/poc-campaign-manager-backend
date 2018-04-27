// @flow

const winston = require('winston');

const config = require('./config');

const transports = [];

function timestamp() {
  return new Date().toISOString();
}

if (config.get('logs:console:active')) {

  let consoleTimestamp = false;
  if (config.get('logs:console:timestamp')) {
    consoleTimestamp = timestamp;
  }

  transports.push(
    new winston.transports.Console({
      level: config.get('logs:level') || 'info',
      timestamp: consoleTimestamp
    }));
}

if (config.get('logs:file:active')) {

  let fileTimestamp = false;
  if (config.get('logs:file:timestamp')) {
    fileTimestamp = timestamp;
  }

  transports.push(
    new winston.transports.File({
      level: config.get('logs:level') || 'info',
      filename: config.get('logs:file:path') || 'hook.log',
      maxsize: 10000000000, // 10 GB
      maxFiles: 1, // for rotation
      timestamp: fileTimestamp,
      json: false
    })
  );
}

const winstonLogger = new (winston.Logger)({
  transports: transports
});

const logger = {};

logger.error = (message: string) => {
  winstonLogger.log({
    level: 'error',
    message: message
  });
};

logger.warn = (message: string) => {
  winstonLogger.log({
    level: 'warn',
    message: message
  });
};

logger.info = winstonLogger.info;

logger.debug = (message: string) => {
  winstonLogger.log({
    level: 'debug',
    message: message
  });
};

module.exports = logger;