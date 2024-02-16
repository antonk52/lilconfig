module.exports = {
    roots: ['<rootDir>/src'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    collectCoverageFrom: ['./src/index.js'],
    coverageThreshold: {
        global: {
            branches: 92,
            functions: 99,
            lines: 99,
            statements: 99,
        },
    },
};
