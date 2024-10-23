import * as dotenv from 'dotenv';

dotenv.config();

/* eslint-disable */
export default {
  displayName: 'pg-sql',
  collectCoverage: true,
  coverageReporters: ['text', 'lcov'],
  coverageDirectory: './dist/coverage',
  testEnvironment: 'node',
  preset: 'ts-jest',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    'index.ts',
    'stub.ts',
    '/src/__REM/',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/src/__REM/', // Add this line to ignore the __REM folder
  ],
};
