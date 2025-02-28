/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
// @flow

module.exports = {
  title: 'signIn',
  type: 'object',
  properties: {
    username: {
      type: 'string',
      minLength: 3,
      maxLength: 64
    },
    password: {
      type: 'string',
      minLength: 5,
      maxLength: 24,
    },
  },
  additionalProperties: false,
  required: ['username', 'password'],
};
