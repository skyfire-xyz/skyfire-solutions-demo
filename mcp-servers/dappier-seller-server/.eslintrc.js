/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['@skyfire-xyz/eslint-config-node'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname
  },
  overrides: [
    {
      files: ['**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unsafe-argument': 'off'
      }
    }
  ],
  rules: {
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
    // todo: change this to error
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
