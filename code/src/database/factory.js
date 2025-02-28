/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
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