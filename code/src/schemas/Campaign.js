
export default {
  title: 'campaign',
  type: 'object',
  properties: {
    id: {
      type: 'string'
    },
    title: {
      type: 'string'
    },
    pryvAppId: {
      type: 'string'
    },
    description: {
      type: 'string'
    },
    permissions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          streamId: {
            type: 'string'
          },
          level: {
            type: 'string'
          },
          defaultName: {
            type: 'string'
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
  ]
};
