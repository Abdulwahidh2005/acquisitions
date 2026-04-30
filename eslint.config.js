import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  js.configs.recommended,

  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        URL: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },

    plugins: {
      prettier: prettierPlugin,
    },

    rules: {
      // Prettier integration
      'prettier/prettier': 'error',

      // Basic rules
      'no-unused-vars': 'warn',
      'no-console': 'off',

      // Style rules (optional, Prettier usually handles this)
      indent: ['error', 2],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
    },
  },

  // Disable ESLint rules that conflict with Prettier
  prettierConfig,
];
