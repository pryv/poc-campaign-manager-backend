// @flow

const http = require('http');

const app: express$Application = require('./app');
const config: nconf = require('./config');
const logger: winston = require('./logger');

const server: http$Server = http.createServer(app);

server.listen(config.get('server:port'), () => {
  logger.info('app node campaign manager server listening on port ' + config.get('server:port'))
});