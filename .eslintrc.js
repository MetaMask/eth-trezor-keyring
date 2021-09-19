module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2018, // to support object rest spread, e.g. {...x, ...y}
  },

  extends: ['@metamask/eslint-config', '@metamask/eslint-config-nodejs'],

  overrides: [
    {
      files: ['test/**/*.js'],
      extends: ['@metamask/eslint-config-mocha'],
    },
  ],

  ignorePatterns: ['dist'],
};
