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
      minLength: 3,
      maxLength: 64
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
