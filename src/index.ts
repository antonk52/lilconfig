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
};

interface OptionsBase {
    stopDir?: string;
    searchPlaces?: string[];
    ignoreEmptySearchPlaces?: boolean;
    packageProp?: string | string[];
}

export type Transform =
    | TransformSync
    | ((result: LilconfigResult) => Promise<LilconfigResult>);
export type TransformSync = (result: LilconfigResult) => LilconfigResult;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LoaderResult = any;
export type LoaderSync = (filepath: string, content: string) => LoaderResult;
export type Loader =
    | LoaderSync
    | ((filepath: string, content: string) => Promise<LoaderResult>);
export type Loaders = Record<string, Loader>;
export type LoadersSync = Record<string, LoaderSync>;

export interface Options extends OptionsBase {
    loaders?: Loaders;
    transform?: Transform;
}

export interface OptionsSync extends OptionsBase {
    loaders?: LoadersSync;
    transform?: TransformSync;
}

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

export const defaultLoaders: LoadersSync = Object.freeze({
    '.js': filepath => {
        return require(filepath);
    },
    '.json': filepath => {
        return require(filepath);
    },
    noExt(_, content) {
        try {
            return JSON.parse(content);
        } catch (e) {
            return null;
        }
    },
});

function getOptions(name: string, options?: OptionsSync): Required<OptionsSync>;
function getOptions(name: string, options?: Options): Required<Options>;
function getOptions(
    name: string,
    options: Options | OptionsSync = {},
): Required<Options | OptionsSync> {
    return {
        stopDir: os.homedir(),
        searchPlaces: getDefaultSearchPlaces(name),
        ignoreEmptySearchPlaces: true,
        transform: (x: LilconfigResult): LilconfigResult => x,
        packageProp: [name],
        ...options,
        loaders: {...defaultLoaders, ...options.loaders},
    };
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
    loaderKey: string;
};

function getSearchItems(
    searchPlaces: string[],
    searchPaths: string[],
): SearchItem[] {
    return searchPaths.reduce<SearchItem[]>((acc, searchPath) => {
        searchPlaces.forEach(fileName =>
            acc.push({
                fileName,
                filePath: path.join(searchPath, fileName),
                loaderKey: path.extname(fileName) || 'noExt',
            }),
        );

        return acc;
    }, []);
}

type AsyncSearcher = {
    search(searchFrom?: string): Promise<LilconfigResult>;
    load(filePath: string): Promise<LilconfigResult>;
};

export function lilconfig(
    name: string,
    options?: Partial<Options>,
): AsyncSearcher {
    const {
        ignoreEmptySearchPlaces,
        loaders,
        packageProp,
        searchPlaces,
        stopDir,
        transform,
    } = getOptions(name, options);

    return {
        async search(searchFrom = process.cwd()): Promise<LilconfigResult> {
            const searchPaths = getSearchPaths(searchFrom, stopDir);

            const result: LilconfigResult = {
                config: null,
                path: '',
            };

            const searchItems = getSearchItems(searchPlaces, searchPaths);
            for (const {fileName, filePath, loaderKey} of searchItems) {
                const exists = await fsExistsAsync(filePath);
                if (!exists) continue;
                const content = String(await fsReadFileAsync(filePath));
                const loader = loaders[loaderKey];

                // handle package.json
                if (fileName === 'package.json') {
                    try {
                        const pkg = loader(filePath, content);
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
                const isEmpty = content.trim() === '';
                if (isEmpty && ignoreEmptySearchPlaces) continue;

                try {
                    result.config = require(filePath);
                    result.path = filePath;
                    if (isEmpty) result.isEmpty = isEmpty;
                } catch (err) {
                    result.config = null;
                    throw new Error(`lol kek ${err}`);
                }
                break;
            }

            // not found
            if (result.path === '' && result.config === null)
                return transform(null);

            return transform(result);
        },
        async load(filePath: string): Promise<LilconfigResult> {
            const {base, ext} = path.parse(filePath);
            const loaderKey = ext || 'noExt';
            const loader = loaders[loaderKey];
            const content = String(await fsReadFileAsync(filePath));

            if (base === 'package.json') {
                const pkg = await loader(filePath, content);
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
            const isEmpty = content.trim() === '';
            if (isEmpty && ignoreEmptySearchPlaces) return transform(null);

            // cosmiconfig returns undefined for empty files
            result.config = isEmpty
                ? undefined
                : await loader(filePath, content);

            return transform(
                isEmpty ? {...result, isEmpty, config: undefined} : result,
            );
        },
    };
}

type SyncSearcher = {
    search(searchFrom?: string): LilconfigResult;
    load(filePath: string): LilconfigResult;
};

export function lilconfigSync(
    name: string,
    options?: OptionsSync,
): SyncSearcher {
    const {
        ignoreEmptySearchPlaces,
        loaders,
        packageProp,
        searchPlaces,
        stopDir,
        transform,
    } = getOptions(name, options);

    return {
        search(searchFrom = process.cwd()): LilconfigResult {
            const searchPaths = getSearchPaths(searchFrom, stopDir);

            const result: LilconfigResult = {
                config: null,
                path: '',
            };

            const searchItems = getSearchItems(searchPlaces, searchPaths);
            for (const {fileName, filePath, loaderKey} of searchItems) {
                const exists = fs.existsSync(filePath);
                if (!exists) continue;
                const loader = loaders[loaderKey];
                const content = String(fs.readFileSync(filePath));

                // handle package.json
                if (fileName === 'package.json') {
                    try {
                        const pkg = loader(filePath, content);
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
                const isEmpty = content.trim() === '';
                if (isEmpty && ignoreEmptySearchPlaces) continue;

                try {
                    result.config = loader(filePath, content);
                    result.path = filePath;
                    if (isEmpty) result.isEmpty = isEmpty;
                } catch (err) {
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
            const {base, ext} = path.parse(filePath);
            const loaderKey = ext || 'noExt';
            const loader = loaders[loaderKey];

            const content = String(fs.readFileSync(filePath));

            if (base === 'package.json') {
                const pkg = loader(filePath, content);
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
            const isEmpty = content.trim() === '';
            if (isEmpty && ignoreEmptySearchPlaces) return transform(null);

            // cosmiconfig returns undefined for empty files
            result.config = isEmpty ? undefined : loader(filePath, content);

            return transform(
                isEmpty ? {...result, isEmpty, config: undefined} : result,
            );
        },
    };
}
