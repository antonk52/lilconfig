module.exports = {
    roots: ['<rootDir>/src'],
    preset: 'ts-jest',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    collectCoverageFrom: ['./src/index.ts'],
    coverageThreshold: {
        global: {
            branches: 97,
            functions: 99,
            lines: 99,
            statements: 99,
        },
    },
};
