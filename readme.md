# Lilconfig ⚙️
[![npm version](https://badge.fury.io/js/lilconfig.svg)](https://badge.fury.io/js/lilconfig)
[![install size](https://packagephobia.now.sh/badge?p=lilconfig)](https://packagephobia.now.sh/result?p=lilconfig)

A tiny replacement for [cosmiconfig](https://www.npmjs.com/package/cosmiconfig) with similar API.

## Installation

```
npm install lilconfig
```

## Usage

```js
import {lilconfig, lilconfigSync} from 'lilconfig';

// all keys are optional
const options = {
    stopDir: '/Users/you/some/dir',
    searchPlaces: ['package.json', 'myapp.config.js'],
    ignoreEmptySearchPlaces: true
}

lilconfig(
    'myapp',
    options // optional
).search() // Promise<LilconfigResult>

lilconfigSync(
    'myapp',
    options // optional
).load(pathToConfig) // LilconfigResult

/*
 * LilconfigResult
 * {
 *   config: any; // your config
 *   path: string;
 * }
 */
```

## Difference to `cosmiconfig`
Lilconfig does not intend to be 100% compatible with `cosmiconfig` but tries to mimic it where possible. `lilconfig` does not plan to:
- support yaml files out of the box
- cache

Options difference between the two.

|Option name             | lilconfig | cosmiconfig|
|------------------------|-----------|------------|
|searchPlaces            | +         | +          |
|loaders                 | -         | +          |
|packageProp             | -         | +          |
|stopDir                 | +         | +          |
|cache                   | -         | +          |
|transform               | +         | +          |
|ignoreEmptySearchPlaces | +         | +          |
