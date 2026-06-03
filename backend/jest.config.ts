import type { Config } from 'jest';

const config: Config = {
  // Use ts-jest to transform TypeScript files
  preset: 'ts-jest',

  // Use Node.js test environment
  testEnvironment: 'node',

  // Test file locations
  roots: ['<rootDir>/src/tests'],

  // Test file patterns
  testMatch: [
    '**/*.test.ts',
    '**/*.spec.ts',
  ],

  // Module path aliases (matching tsconfig.json paths)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@configs/(.*)$': '<rootDir>/src/configs/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@repositories/(.*)$': '<rootDir>/src/repositories/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@validators/(.*)$': '<rootDir>/src/validators/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@jobs/(.*)$': '<rootDir>/src/jobs/$1',
    '^@queues/(.*)$': '<rootDir>/src/queues/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@database/(.*)$': '<rootDir>/src/database/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
  },

  // Setup files run before each test suite
  setupFiles: ['<rootDir>/src/tests/helpers/setup.ts'],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'clover'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/tests/**',
    '!src/types/**',
    '!src/server.ts',
    '!src/database/migrate.ts',
    '!src/database/seed.ts',
  ],
  coverageThresholds: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Transform configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },

  // Timeouts
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
};

export default config;
