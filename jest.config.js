module.exports = {
    roots: ['<rootDir>/src'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    collectCoverageFrom: ['./src/index.js'],
    coverageThreshold: {
        global: {
            branches: 97,
            functions: 99,
            lines: 99,
            statements: 99,
        },
    },
};
