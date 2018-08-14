// @flow

module.exports = {
  title: 'campaign',
  type: 'object',
  properties: {
    id: {
      type: 'string'
    },
    title: {
      type: 'string',
      minLength: 3,
      maxLength: 100
    },
    description: {
      type: 'string',
      minLength: 3,
      maxLength: 10000
    },
    permissions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          streamId: {
            type: 'string',
            minLength: 1,
            maxLength: 64
          },
          level: {
            type: 'string',
            enum: ['read', 'contribute', 'manage']
          },
          defaultName: {
            type: 'string',
            minLength: 1,
            maxLength: 64
          }
        }
      }
    },
    created: {
      type: 'number'
    }
  },
  required: [
    'title',
    'description',
    'permissions'
  ],
  additionalProperties: false
};
