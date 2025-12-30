/**
 * Jest Configuration for Next.js
 * @see https://nextjs.org/docs/testing
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Next.js 앱의 경로
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  // 테스트 환경
  testEnvironment: 'jest-environment-jsdom',
  
  // 설정 파일
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // 모듈 경로 별칭
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // 테스트 패턴
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  
  // 커버리지 설정
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.{js,ts}',
    '!src/app/api/**/*',  // API routes are tested differently
  ],
  
  // 테스트 타임아웃
  testTimeout: 10000,
  
  // 변환 무시 패턴
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  
  // 모의 파일
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

module.exports = createJestConfig(customJestConfig);


