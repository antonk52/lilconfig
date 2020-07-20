# Lilconfig ⚙️
[![npm version](https://badge.fury.io/js/lilconfig.svg)](https://badge.fury.io/js/lilconfig)
[![install size](https://packagephobia.now.sh/badge?p=lilconfig)](https://packagephobia.now.sh/result?p=lilconfig)
[![Coverage Status](https://coveralls.io/repos/github/antonk52/lilconfig/badge.svg)](https://coveralls.io/github/antonk52/lilconfig)

A zero-dependency alternative for [cosmiconfig](https://www.npmjs.com/package/cosmiconfig) with the same API.

## Installation

```sh
npm install lilconfig
```

## Usage

```js
import {lilconfig, lilconfigSync} from 'lilconfig';

// all keys are optional
const options = {
    stopDir: '/Users/you/some/dir',
    searchPlaces: ['package.json', 'myapp.conf.js'],
    ignoreEmptySearchPlaces: false
}

lilconfig(
    'myapp',
    options // optional
).search() // Promise<LilconfigResult>

lilconfigSync(
    'myapp',
    options // optional
).load(pathToConfig) // LilconfigResult

/**
 * LilconfigResult
 * {
 *   config: any; // your config
 *   filepath: string;
 * }
 */
```

## Difference to `cosmiconfig`
Lilconfig does not intend to be 100% compatible with `cosmiconfig` but tries to mimic it where possible. The key differences are:
- **no** support for yaml files out of the box(`lilconfig` attempts to parse files with no extension as JSON instead of YAML)
- **no** cache

Options difference between the two.

|cosmiconfig option name | lilconfig |
|------------------------|-----------|
|cache                   | ❌        |
|loaders                 | ✅        |
|ignoreEmptySearchPlaces | ✅        |
|packageProp             | ✅        |
|searchPlaces            | ✅        |
|stopDir                 | ✅        |
|transform               | ✅        |

## Loaders examples

If you need the YAML support you can provide your own loader, see example below

```js
import {lilconig} from 'lilconfig';
import yaml from 'yaml';

const options = {
    loaders: {
        '.yaml': (filepath, content) => {
            return yaml.parse(content);
        }
    }
};

lilconfig('myapp', options)
    .search()
    .then(result => {
        result // {config, filepath}
    });
```
