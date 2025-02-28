/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
// @flow

module.exports = {
  title: 'invitation',
  type: 'object',
  properties: {
    id: {
      type: 'string'
    },
    headId: {
      type: 'string'
    },
    requestee: {
      type: 'object',
      properties: {
        id: {
          type: 'string'
        },
        pryvUsername: {
          type: 'string'
        }
      }
    },
    requester: {
      type: 'object',
      properties: {
        id: {
          type: 'string'
        },
        username: {
          type: 'string'
        },
        pryvUsername: {
          type: 'string'
        }
      }
    },
    campaign: {
      type: 'object',
      properties: {
        id: {
          type: 'string'
        },
        title: {
          type: 'string'
        },
        pryvUsername: {
          type: 'string'
        }
      }
    },
    accessToken: {
      type: 'string',
      minLength: 3,
      maxLength: 64
    },
    created: {
      type: 'number'
    },
    modified: {
      type: 'number'
    },
    status: {
      type: 'string',
      minLength: 3,
      maxLength: 64,
      nullable: true,
    }
  },
  required: [
    'campaign',
    'requestee'
  ],
  additionalProperties: false
};
