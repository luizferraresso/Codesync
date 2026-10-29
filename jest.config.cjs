module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/unit/**/*.test.js', '<rootDir>/tests/http/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/helpers/setup-env.js'],
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html', 'lcov'],
  coverageThreshold: { global: { lines: 80, branches: 70, functions: 65, statements: 80 } }
};
