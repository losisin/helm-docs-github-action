// See: https://eslint.org/docs/latest/use/configure/configuration-files

import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import jest from 'eslint-plugin-jest'
import prettier from 'eslint-plugin-prettier'
import globals from 'globals'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

const sharedGlobals = {
  ...globals.node,
  ...globals.jest,
  Atomics: 'readonly',
  SharedArrayBuffer: 'readonly'
}

const sharedRules = {
  camelcase: 'off',
  'eslint-comments/no-use': 'off',
  'eslint-comments/no-unused-disable': 'off',
  'i18n-text/no-en': 'off',
  'import/no-namespace': 'off',
  'no-console': 'off',
  'no-shadow': 'off',
  'no-unused-vars': 'off',
  'prettier/prettier': 'error'
}

const sharedSettings = {
  'import/resolver': {
    typescript: {
      alwaysTryTypes: true,
      project: 'tsconfig.json'
    }
  }
}

const sharedPlugins = {
  jest,
  prettier,
  '@typescript-eslint': typescriptEslint
}

export default [
  {
    ignores: ['**/coverage', '**/dist', '**/linter', '**/node_modules']
  },
  ...compat.extends(
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:jest/recommended',
    'plugin:prettier/recommended'
  ),
  {
    files: ['**/*.ts'],

    plugins: sharedPlugins,

    languageOptions: {
      globals: sharedGlobals,
      parser: tsParser,
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: import.meta.dirname
      }
    },

    settings: sharedSettings,
    rules: sharedRules
  },
  {
    files: ['**/*.{js,mjs,cjs}'],

    plugins: sharedPlugins,

    languageOptions: {
      globals: sharedGlobals,
      parser: tsParser,
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: {}
    },

    settings: sharedSettings,
    rules: sharedRules
  }
]
