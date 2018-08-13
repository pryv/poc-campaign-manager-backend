// @flow

const nconf = require('nconf');
const fs = require('fs');

module.exports = nconf;

nconf.argv();

let configFile = '';

if (typeof(nconf.get('config')) !== 'undefined') {
  configFile = nconf.get('config');
}

if (fs.existsSync(configFile)) {
  configFile = fs.realpathSync(configFile);
  console.log('Using custom config file: ' + configFile);
  nconf.file({ file: configFile});
} else {
  if (configFile) {
    console.log('Cannot find custom config file: ' + configFile);
  }
}

if (process.env.NODE_ENV === 'dev') {
  nconf.overrides({
    server: {
      port: 9000
    },
    logs: {
      console: {
        active: false
      }
    },
    database: {
      path: './test.db',
      options: {
        memory: true
      }
    },
    pryv: {
      domain: 'pryv.li',
    },
  });
}

// Set default values
nconf.defaults({
  server: {
    port: 9000
  },
  logs: {
    console: {
      active: true,
      timestamp: true
    }
  },
  database: {
    path: './campaign-management.db',
    options: {},
  },
  pryv: {
    domain: 'pryv.me',
  },
});