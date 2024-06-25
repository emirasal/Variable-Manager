module.exports = {
    root: true,
    env: {
      node: true,
    },
    parserOptions: {
      parser: '@babel/eslint-parser',
      requireConfigFile: false,
      ecmaVersion: 2018,
      sourceType: 'module',
    },
    extends: [
      'plugin:vue/vue3-essential', // Adjust for Vue 2 or Vue 3 as needed
      'eslint:recommended',
    ],
    rules: {
      // Additional rules can be added here as needed
    },
  };
  