module.exports = {
    root: true,
    extends: ['@tophat/eslint-config/base', '@tophat/eslint-config/jest'],
    rules: {
        'prettier/prettier': [
            'error',
            {
                printWidth: 100,
                tabWidth: 4,
                semi: false,
                trailingComma: 'all' /* Reduces git diff. */,
                singleQuote: true,
                arrowParens: 'always', // Reduces character diff when adding Typescript types.
            },
        ],
        '@typescript-eslint/no-non-null-assertion': 'off',
        'no-empty': ['error', { allowEmptyCatch: true }],
    },
}
