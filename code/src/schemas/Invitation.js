
export default {
  title: 'invitation',
  type: 'object',
  properties: {
    id: {
      type: 'string'
    },
    requesteePryvUsername: {
      type: 'string',
      minLength: 5,
      maxLength: 24
    },
    requestee: {
      type: 'string',
      minLength: 3,
      maxLength: 64,
      nullable: true,
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
      maxLength: 64,
      nullable: true,
    }
  },
  required: [
    'campaignId',
  ],
  additionalProperties: false
};
