/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
// @flow

module.exports = {
  title: 'user',
  type: 'object',
  properties: {
    id: {
      type: 'string'
    },
    username: {
      type: 'string',
      pattern: '^[a-z0-9]{3,25}$',
    },
    pryvUsername: {
      type: 'string',
      minLength: 5,
      maxLength: 24
    },
    pryvToken: {
      type: 'string',
      minLength: 10,
      maxLength: 30,
    },
    password: {
      type: 'string',
      minLength: 5,
      maxLength: 24,
    },
  },
  additionalProperties: false
};
