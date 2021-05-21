module.exports = {
  root: true,

  extends: [
    '@metamask/eslint-config',
    '@metamask/eslint-config-mocha',
    '@metamask/eslint-config-nodejs',
  ],

  plugins: ['json', 'import'],

  overrides: [
    {
      files: ['.eslintrc.js'],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],

  ignorePatterns: ['dist'],
};
