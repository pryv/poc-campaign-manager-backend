// @flow

const Database = require('./Database');

let databaseInstance: Database;

module.exports = {
  getInstance: (): Database => {
    if (databaseInstance != null) return databaseInstance;

    databaseInstance = new Database();
    return databaseInstance;
  }
};