// @flow

export default {
  title: 'user',
  type: 'object',
  properties: {
    id: {
      type: 'string'
    },
    username: {
      type: 'string',
      minLength: 3,
      maxLength: 64
    },
    pryvUsername: {
      type: 'string',
      minlength: 5,
      maxLength: 24
    }
  },
  additionalProperties: false
};
