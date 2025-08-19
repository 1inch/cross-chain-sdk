/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

module.exports = {
    clearMocks: true,
    collectCoverageFrom: ['**/*.(t|j)s'],
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: ['/node_modules/', 'dist', 'src/index.ts'],
    coverageProvider: 'v8',
    coverageReporters: ['json-summary', 'lcov'],
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'src',
    testEnvironment: 'node',
    testMatch: [
        '**/__tests__/**/*.[jt]s?(x)',
        '**/?(*.)+(spec|test).[tj]s?(x)'
    ],
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    transform: {
        '^.+\\.(t|j)s$': '@swc/jest'
    },
    transformIgnorePatterns: [
        '<rootDir>/node_modules/.pnpm/(?!(axios|@1inch\\+limit-order-sdk)@)'
    ],
    moduleNameMapper: {
        '^bn.js$': 'bn.js',
        '^@solana/web3.js$': '@solana/web3.js',
        '(.+)\\.js': '$1'
    }
}
