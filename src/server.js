const http = require('http');

const app = require('app');
const config = require('config');
const logger = require('logger');

const server = http.createServer(app);

server.listen(config.port, () => {
  logger.info('app node campaign manager server listening on port ' + config.port)
});