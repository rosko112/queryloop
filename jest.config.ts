import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/tests/e2e/'],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    '!app/**/api/**',
    '!app/**/loading.tsx',
    '!app/**/layout.tsx',
  ],
  coverageDirectory: 'coverage',
};

export default createJestConfig(customJestConfig);
