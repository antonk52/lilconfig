import path from 'path';
import fs from 'fs';
import os from 'os';
import util from 'util';

const fsExistsAsync = util.promisify(fs.exists);
const fsReadFileAsync = util.promisify(fs.readFile);

export type LilconfigResult = null | {
    path: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config: any;
    isEmpty?: boolean;
    error?: Error;
};

type Options = {
    stopDir: string;
    searchPlaces: string[];
    transform: (result: LilconfigResult) => LilconfigResult;
    ignoreEmptySearchPlaces: boolean;
    packageProp: string | string[];
};

function getDefaultSearchPlaces(name: string): string[] {
    return [
        'package.json',
        `.${name}rc.json`,
        `.${name}rc.js`,
        `${name}.config.js`,
    ];
}

function getSearchPaths(startDir: string, stopDir: string): string[] {
    return startDir
        .split(path.sep)
        .reduceRight<{searchPlaces: string[]; passedStopDir: boolean}>(
            (acc, _, ind, arr) => {
                const currentPath = arr.slice(0, ind + 1).join(path.sep);
                if (!acc.passedStopDir) acc.searchPlaces.push(currentPath);
                if (currentPath === stopDir) acc.passedStopDir = true;
                return acc;
            },
            {searchPlaces: [], passedStopDir: false},
        ).searchPlaces;
}

function getOptions(name: string, options?: Partial<Options>): Options {
    return Object.assign(
        {
            stopDir: os.homedir(),
            searchPlaces: getDefaultSearchPlaces(name),
            ignoreEmptySearchPlaces: true,
            transform: (result: LilconfigResult) => result,
            packageProp: [name],
        },
        options ?? {},
    );
}

function getPackageProp(
    props: string | string[],
    obj: Record<string, unknown>,
): unknown {
    const propsArr = typeof props === 'string' ? props.split('.') : props;
    return (
        propsArr.reduce(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (acc: any, prop): unknown => (acc == null ? acc : acc[prop]),
            obj,
        ) || null
    );
}

type SearchItem = {
    filePath: string;
    fileName: string;
};

function getSearchItems(
    searchPlaces: string[],
    searchPaths: string[],
): SearchItem[] {
    return searchPaths.reduce<SearchItem[]>((acc, searchPath) => {
        searchPlaces.forEach(fileName => {
            acc.push({
                fileName,
                filePath: path.join(searchPath, fileName),
            });
        });

        return acc;
    }, []);
}

export function lilconfig(name: string, options: Partial<Options> = {}) {
    const {
        ignoreEmptySearchPlaces,
        packageProp,
        searchPlaces,
        stopDir,
        transform,
    } = getOptions(name, options);

    return {
        async search(searchFrom = process.cwd()) {
            const searchPaths = getSearchPaths(searchFrom, stopDir);

            const result: LilconfigResult = {
                config: null,
                path: '',
            };

            const searchItems = getSearchItems(searchPlaces, searchPaths);
            for (const {fileName, filePath} of searchItems) {
                const exists = await fsExistsAsync(filePath);
                if (!exists) continue;

                // handle package.json
                if (fileName === 'package.json') {
                    try {
                        const pkg = require(filePath);
                        const maybeConfig = getPackageProp(packageProp, pkg);
                        if (maybeConfig != null) {
                            result.config = maybeConfig;
                            result.path = filePath;
                            break;
                        }
                    } catch (err) {}

                    continue;
                }

                // handle other type of configs
                const content = String(await fsReadFileAsync(filePath));
                const isEmpty = content.trim() === '';
                if (isEmpty && ignoreEmptySearchPlaces) continue;

                try {
                    result.config = require(filePath);
                    result.path = filePath;
                    if (isEmpty) result.isEmpty = isEmpty;
                } catch (err) {
                    result.error = err;
                    result.config = null;
                }
                break;
            }

            // not found
            if (result.path === '' && result.config === null)
                return transform(null);

            return transform(result);
        },
        async load(filePath: string) {
            const exists = await fsExistsAsync(filePath);
            if (!exists) return null;

            const {base} = path.parse(filePath);

            if (base === 'package.json') {
                const pkg = await import(filePath);
                return transform({
                    config: getPackageProp(packageProp, pkg),
                    path: filePath,
                });
            }
            const result: LilconfigResult = {
                config: null,
                path: filePath,
            };
            // handle other type of configs
            const content = String(await fsReadFileAsync(filePath));
            const isEmpty = content.trim() === '';
            if (isEmpty && ignoreEmptySearchPlaces) return transform(null);

            // cosmiconfig returns undefined for empty files
            result.config = isEmpty ? undefined : await import(filePath);

            return transform(
                isEmpty ? {...result, isEmpty, config: undefined} : result,
            );
        },
    };
}

export function lilconfigSync(name: string, options: Partial<Options> = {}) {
    const {
        ignoreEmptySearchPlaces,
        packageProp,
        searchPlaces,
        stopDir,
        transform,
    } = getOptions(name, options);

    return {
        search(searchFrom = process.cwd()) {
            const searchPaths = getSearchPaths(searchFrom, stopDir);

            const result: LilconfigResult = {
                config: null,
                path: '',
            };

            const searchItems = getSearchItems(searchPlaces, searchPaths);
            for (const {fileName, filePath} of searchItems) {
                const exists = fs.existsSync(filePath);
                if (!exists) continue;

                // handle package.json
                if (fileName === 'package.json') {
                    try {
                        const pkg = require(filePath);
                        const maybeConfig = getPackageProp(packageProp, pkg);
                        if (maybeConfig != null) {
                            result.config = maybeConfig;
                            result.path = filePath;
                            break;
                        }
                    } catch (err) {}

                    continue;
                }

                // handle other type of configs
                const content = String(fs.readFileSync(filePath));
                const isEmpty = content.trim() === '';
                if (isEmpty && ignoreEmptySearchPlaces) continue;

                try {
                    result.config = require(filePath);
                    result.path = filePath;
                    if (isEmpty) result.isEmpty = isEmpty;
                } catch (err) {
                    result.error = err;
                    result.config = null;
                }
                break;
            }

            // not found
            if (result.path === '' && result.config === null)
                return transform(null);

            return transform(result);
        },
        load(filePath: string): LilconfigResult {
            if (!fs.existsSync(filePath)) return null;

            const {base} = path.parse(filePath);

            if (base === 'package.json') {
                const pkg = require(filePath);
                return transform({
                    config: getPackageProp(packageProp, pkg),
                    path: filePath,
                });
            }
            const result: LilconfigResult = {
                config: null,
                path: filePath,
            };
            // handle other type of configs
            const content = fs.readFileSync(filePath).toString();
            const isEmpty = content.trim() === '';
            if (isEmpty && ignoreEmptySearchPlaces) return transform(null);

            // cosmiconfig returns undefined for empty files
            result.config = isEmpty ? undefined : require(filePath);

            return transform(
                isEmpty ? {...result, isEmpty, config: undefined} : result,
            );
        },
    };
}
