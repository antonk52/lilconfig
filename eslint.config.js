const eslint = require('@eslint/js');
const prettierPlugin = require('eslint-plugin-prettier/recommended');

module.exports = [
    eslint.configs.recommended,
    prettierPlugin,
    {
        rules: {
            'no-undef': 'off',
            'no-constant-condition': 'off',
            'prefer-const': 'error',
        },
    },
];
