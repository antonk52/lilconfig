module.exports = {
    roots: ['<rootDir>/src'],
    preset: 'ts-jest',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    collectCoverageFrom: ['./src/index.ts'],
};
