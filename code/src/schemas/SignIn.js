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
