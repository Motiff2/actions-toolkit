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

import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';
import * as fs from 'fs';
import path from 'path';
import * as io from '@actions/io';
import osm = require('os');
import * as rimraf from 'rimraf';

import {Docker} from '../../src/docker/docker';
import {Exec} from '../../src/exec';

import {ConfigFile} from '../../src/types/docker/docker';

const fixturesDir = path.join(__dirname, '..', 'fixtures');

// prettier-ignore
const tmpDir = path.join(process.env.TEMP || '/tmp', 'docker-jest');

afterEach(function () {
  rimraf.sync(tmpDir);
});

describe('configDir', () => {
  const originalEnv = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      DOCKER_CONFIG: '/var/docker/config'
    };
  });
  afterEach(() => {
    process.env = originalEnv;
  });
  it('returns default', async () => {
    process.env.DOCKER_CONFIG = '';
    jest.spyOn(osm, 'homedir').mockImplementation(() => path.join('/tmp', 'home'));
    expect(Docker.configDir).toEqual(path.join('/tmp', 'home', '.docker'));
  });
  it('returns from env', async () => {
    expect(Docker.configDir).toEqual('/var/docker/config');
  });
});

describe('configFile', () => {
  const originalEnv = process.env;
  beforeEach(() => {
    jest.resetModules();
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, {recursive: true});
    }
    process.env = {
      ...originalEnv,
      DOCKER_CONFIG: tmpDir
    };
  });
  afterEach(() => {
    process.env = originalEnv;
  });
  it('auths', async () => {
    fs.copyFileSync(path.join(fixturesDir, 'docker-config-auths.json'), path.join(tmpDir, 'config.json'));
    expect(Docker.configFile()).toEqual({
      auths: {
        'https://index.docker.io/v1/': {
          auth: 'am9lam9lOmhlbGxv',
          email: 'user@example.com'
        }
      }
    } as unknown as ConfigFile);
  });
  it('proxies', async () => {
    fs.copyFileSync(path.join(fixturesDir, 'docker-config-proxies.json'), path.join(tmpDir, 'config.json'));
    expect(Docker.configFile()).toEqual({
      proxies: {
        default: {
          httpProxy: 'http://127.0.0.1:3128',
          httpsProxy: 'http://127.0.0.1:3128'
        }
      }
    } as unknown as ConfigFile);
  });
});

describe('isAvailable', () => {
  it('cli', async () => {
    const ioWhichSpy = jest.spyOn(io, 'which');
    await Docker.isAvailable();
    expect(ioWhichSpy).toHaveBeenCalledTimes(1);
    expect(ioWhichSpy).toHaveBeenCalledWith('docker', true);
  });
});

describe('context', () => {
  it('call docker context show', async () => {
    const execSpy = jest.spyOn(Exec, 'getExecOutput');
    await Docker.context().catch(() => {
      // noop
    });
    expect(execSpy).toHaveBeenCalledWith(`docker`, ['context', 'inspect', '--format', '{{.Name}}'], {
      ignoreReturnCode: true,
      silent: true
    });
  });
});

describe('contextInspect', () => {
  it('call docker context inspect', async () => {
    const execSpy = jest.spyOn(Exec, 'getExecOutput');
    await Docker.contextInspect('foo').catch(() => {
      // noop
    });
    expect(execSpy).toHaveBeenCalledWith(`docker`, ['context', 'inspect', '--format=json', 'foo'], {
      ignoreReturnCode: true,
      silent: true
    });
  });
});

describe('printVersion', () => {
  it('call docker version', async () => {
    const execSpy = jest.spyOn(Exec, 'exec');
    await Docker.printVersion().catch(() => {
      // noop
    });
    expect(execSpy).toHaveBeenCalledWith(`docker`, ['version']);
  });
});

describe('printInfo', () => {
  it('call docker info', async () => {
    const execSpy = jest.spyOn(Exec, 'exec');
    await Docker.printInfo().catch(() => {
      // noop
    });
    expect(execSpy).toHaveBeenCalledWith(`docker`, ['info']);
  });
});
