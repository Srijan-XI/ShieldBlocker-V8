// ESLint flat config (ESLint v9+)
'use strict';

module.exports = [
  {
    // Browser globals for extension source files
    files: ['background.js', 'content.js', 'storage.js', 'popup/*.js', 'utils/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        chrome: 'readonly',
        document: 'readonly',
        window: 'readonly',
        location: 'readonly',
        MutationObserver: 'readonly',
        Promise: 'readonly',
        URL: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'warn',
      'no-undef': 'error',
    },
  },
  {
    // Node.js globals for build scripts
    files: ['scripts/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        Promise: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-var': 'error',
      'prefer-const': 'warn',
      'eqeqeq': ['error', 'always'],
    },
  },
  {
    // Test files
    files: ['tests/**/*.test.js'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        require: 'readonly',
        module: 'readonly',
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
      },
    },
  },
  {
    ignores: ['node_modules/**', 'rules/generated_blocklist*.json', '_metadata/**'],
  },
];
