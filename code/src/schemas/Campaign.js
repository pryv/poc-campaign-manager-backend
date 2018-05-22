// @flow

export default {
  title: 'campaign',
  type: 'object',
  properties: {
    id: {
      type: 'string'
    },
    title: {
      type: 'string',
      minLength: 3,
      maxLength: 20
    },
    pryvAppId: {
      type: 'string',
      minlength: 5,
      maxLength: 20
    },
    description: {
      type: 'string',
      minlength: 3,
      maxLength: 3000
    },
    permissions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          streamId: {
            type: 'string',
            minlength: 1,
            maxLengh: 64
          },
          level: {
            type: 'string',
            enum: ['read', 'contribute', 'manage']
          },
          defaultName: {
            type: 'string',
            minlength: 1,
            maxlength: 64
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
    'pryvAppId',
    'description',
    'permissions'
  ],
  additionalProperties: false
};
