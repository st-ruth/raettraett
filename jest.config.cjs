module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/tests/**/*.test.ts?(x)'],
  setupFiles: ['<rootDir>/tests/jest.setup.cjs'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true, tsconfig: 'tsconfig.test.json' }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '\\.(css)$': '<rootDir>/tests/styleMock.cjs',
  },
};
