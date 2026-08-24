/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['@skyfire-xyz/eslint-config-node'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname
  },
  overrides: [
    {
      files: ['test/**/*.ts'],
      parserOptions: {
        project: './tsconfig.test.json'
      },
      rules: {
        // node:test's describe/test return promises by design
        '@typescript-eslint/no-floating-promises': 'off'
      }
    },
    {
      files: ['**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unsafe-argument': 'off'
      }
    }
  ],
  rules: {
    // tsc and node resolve these; the import resolver can't follow the SDK's
    // wildcard "exports" map, which routes types through dist/esm/*.d.ts and
    // so misses the .js -> .d.ts substitution
    'import/no-unresolved': [
      'error',
      { ignore: ['^@modelcontextprotocol/sdk/'] }
    ],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '**/__fixtures__/*.ts',
          '**/__tests__/**/*.ts',
          '**/*.test.ts'
        ]
      }
    ],
    'import/order': ['warn'],
    '@typescript-eslint/strict-boolean-expressions': ['off']
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json' // Adjust the path to tsconfig.json's setup
      }
    }
  }
}
