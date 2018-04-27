const http = require('http');

const app = require('./app');
const config = require('./config');
const logger = require('./logger');

const server = http.createServer(app);

server.listen(config.get('server:port'), () => {
  logger.info('app node campaign manager server listening on port ' + config.get('server:port'))
});