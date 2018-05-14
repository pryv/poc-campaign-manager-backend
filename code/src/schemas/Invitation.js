
export default {
  title: 'invitation',
  type: 'object',
  properties: {
    id: {
      type: 'string'
    },
    requestee: {
      type: 'string',
      minLength: 3,
      maxLength: 64
    },
    campaignId: {
      type: 'string',
      minLength: 3,
      maxLength: 64
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
      maxLength: 64
    }
  }
};
