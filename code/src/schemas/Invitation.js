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
      propserties: {
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
    requester: {
      type: 'object',
      propserties: {
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
      propserties: {
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
