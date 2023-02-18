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

import * as exec from '@actions/exec';

import {Buildx} from './buildx';
import {Context} from '../context';

import {BuilderInfo, NodeInfo} from '../types/builder';

export interface BuilderOpts {
  context: Context;
  buildx?: Buildx;
}

export class Builder {
  private readonly context: Context;
  private readonly buildx: Buildx;

  constructor(opts: BuilderOpts) {
    this.context = opts.context;
    this.buildx =
      opts?.buildx ||
      new Buildx({
        context: this.context
      });
  }

  public async inspect(name: string): Promise<BuilderInfo> {
    const cmd = await this.buildx.getCommand(['inspect', name]);
    return await exec
      .getExecOutput(cmd.command, cmd.args, {
        ignoreReturnCode: true,
        silent: true
      })
      .then(res => {
        if (res.stderr.length > 0 && res.exitCode != 0) {
          throw new Error(res.stderr.trim());
        }
        return Builder.parseInspect(res.stdout);
      });
  }

  public static parseInspect(data: string): BuilderInfo {
    const builder: BuilderInfo = {
      nodes: []
    };
    let node: NodeInfo = {};
    for (const line of data.trim().split(`\n`)) {
      const [key, ...rest] = line.split(':');
      const value = rest.map(v => v.trim()).join(':');
      if (key.length == 0 || value.length == 0) {
        continue;
      }
      switch (key.toLowerCase()) {
        case 'name': {
          if (builder.name == undefined) {
            builder.name = value;
          } else {
            if (Object.keys(node).length > 0) {
              builder.nodes.push(node);
              node = {};
            }
            node.name = value;
          }
          break;
        }
        case 'driver': {
          builder.driver = value;
          break;
        }
        case 'last activity': {
          builder.lastActivity = new Date(value);
          break;
        }
        case 'endpoint': {
          node.endpoint = value;
          break;
        }
        case 'driver options': {
          node.driverOpts = (value.match(/(\w+)="([^"]*)"/g) || []).map(v => v.replace(/^(.*)="(.*)"$/g, '$1=$2'));
          break;
        }
        case 'status': {
          node.status = value;
          break;
        }
        case 'flags': {
          node.buildkitdFlags = value;
          break;
        }
        case 'buildkit': {
          node.buildkitVersion = value;
          break;
        }
        case 'platforms': {
          let platforms: Array<string> = [];
          // if a preferred platform is being set then use only these
          // https://docs.docker.com/engine/reference/commandline/buildx_inspect/#get-information-about-a-builder-instance
          if (value.includes('*')) {
            for (const platform of value.split(', ')) {
              if (platform.includes('*')) {
                platforms.push(platform.replace('*', ''));
              }
            }
          } else {
            // otherwise set all platforms available
            platforms = value.split(', ');
          }
          node.platforms = platforms.join(',');
          break;
        }
      }
    }
    if (Object.keys(node).length > 0) {
      builder.nodes.push(node);
    }
    return builder;
  }
}
