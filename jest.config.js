/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1'
    },
    collectCoverageFrom: [
        'httpServer/**/*.ts',
        'utils/**/*.ts',
        '!**/*.d.ts'
    ],
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    }
};
