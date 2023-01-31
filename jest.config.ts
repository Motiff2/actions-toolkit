/**
 * Copyright 2023 actions-toolkit authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

process.env = Object.assign({}, process.env, {
  GITHUB_REPOSITORY: 'docker/actions-toolkit',
  RUNNER_TEMP: '/tmp/github_runner',
  RUNNER_TOOL_CACHE: '/tmp/github_tool_cache'
}) as {
  [key: string]: string;
};

module.exports = {
  clearMocks: true,
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'ts'],
  setupFiles: ['dotenv/config'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  moduleNameMapper: {
    '^csv-parse/sync': '<rootDir>/node_modules/csv-parse/dist/cjs/sync.cjs'
  },
  collectCoverageFrom: ['src/**/{!(toolkit.ts),}.ts'],
  coveragePathIgnorePatterns: ['lib/', 'node_modules/', '__mocks__/', '__tests__/'],
  verbose: true
};
