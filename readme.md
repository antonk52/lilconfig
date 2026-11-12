# Lilconfig ⚙️
[![npm version](https://badge.fury.io/js/lilconfig.svg)](https://badge.fury.io/js/lilconfig)
[![install size](https://packagephobia.now.sh/badge?p=lilconfig)](https://packagephobia.now.sh/result?p=lilconfig)
[![Coverage Status](https://coveralls.io/repos/github/antonk52/lilconfig/badge.svg)](https://coveralls.io/github/antonk52/lilconfig)

A zero-dependency alternative to [cosmiconfig](https://www.npmjs.com/package/cosmiconfig) with the same API.

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

## ESM

ESM configs can be loaded with **async API only**. Specifically `js` files in projects with `"type": "module"` in `package.json` or `mjs` files.

## TypeScript

If the runtime can load TypeScript files natively (`process.features.typescript` is truthy: nodejs 22.6+ with `--experimental-strip-types`, enabled by default since nodejs 22.18), lilconfig also searches for `ts`, `cts` and `mts` config files (`mts` with the **async API only**, same as `mjs`). The files are loaded by the runtime itself, so its limitations apply as if you ran the file with node directly, e.g. type stripping does not support enums.

On runtimes without native TypeScript support the defaults are unchanged, but you can opt in by providing custom `searchPlaces` and a loader for the `.ts` extension.

## Difference to `cosmiconfig`
Lilconfig does not intend to be 100% compatible with `cosmiconfig` but tries to mimic it where possible. The key difference is **no** support for YAML files out of the box(`lilconfig` attempts to parse files with no extension as JSON instead of YAML). You can still add the support for YAML files by providing a loader, see an [example](#yaml-loader) below.

### Option difference between the two.

|cosmiconfig option      | lilconfig |
|------------------------|-----------|
|cache                   | ✅        |
|loaders                 | ✅        |
|ignoreEmptySearchPlaces | ✅        |
|packageProp             | ✅        |
|searchPlaces            | ✅        |
|stopDir                 | ✅        |
|transform               | ✅        |

## Loaders examples

### Yaml loader

If you need the YAML support, you can provide your own loader

```js
import {lilconfig} from 'lilconfig';
import yaml from 'yaml';

function loadYaml(filepath, content) {
    return yaml.parse(content);
}

const options = {
    loaders: {
        '.yaml': loadYaml,
        '.yml': loadYaml,
        // loader for files with no extension
        noExt: loadYaml
    }
};

lilconfig('myapp', options)
    .search()
    .then(result => {
        result // {config, filepath}
    });
```

## Version correlation

- lilconfig v1 → cosmiconfig v6
- lilconfig v2 → cosmiconfig v7
- lilconfig v3 → cosmiconfig v8
