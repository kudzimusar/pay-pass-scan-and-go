/**
 * Jest Configuration for PayPass Platform
 * Comprehensive testing setup with coverage requirements
 */

/** @type {import('jest').Config} */
const config = {
  // Test environment
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  
  // Module name mapping for absolute imports
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
  },
  
  // Test patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
    '<rootDir>/components/**/*.{test,spec}.{ts,tsx}',
    '<rootDir>/lib/**/*.{test,spec}.{ts,tsx}',
    '<rootDir>/hooks/**/*.{test,spec}.{ts,tsx}',
    '<rootDir>/app/**/*.{test,spec}.{ts,tsx}',
  ],
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/*.test.{ts,tsx}',
    '!**/*.spec.{ts,tsx}',
    '!**/*.stories.{ts,tsx}',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/dist/**',
    '!**/.next/**',
  ],
  
  // Coverage thresholds (aligned with PLAN.md requirements)
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Higher coverage for critical payment functionality
    './lib/services/payment*': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './lib/services/auth*': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './lib/services/fraud*': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json',
  ],
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',
    '<rootDir>/dist/',
  ],
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@testing-library))',
  ],
  
  // Global variables
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  
  // Max worker configuration for CI/CD
  maxWorkers: process.env.CI ? 2 : '50%',
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output in CI
  verbose: !!process.env.CI,
  
  // Cache directory
  cacheDirectory: '<rootDir>/.jest/cache',
  
  // Error handling
  errorOnDeprecated: true,
  
  // Performance optimization
  clearMocks: true,
  restoreMocks: true,
  
  // Watch plugins for development
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};

export default config;