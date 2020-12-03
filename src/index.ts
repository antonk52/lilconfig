import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const fsReadFileAsync = fs.promises.readFile;

export type LilconfigResult = null | {
    filepath: string;
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
        `.${name}rc.cjs`,
        `${name}.config.cjs`,
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
    '.js': require,
    '.json': require,
    '.cjs': require,
    noExt(_, content) {
        return JSON.parse(content);
    },
});

function getExtDesc(ext: string): string {
    return ext === 'noExt' ? 'files without extensions' : `extension "${ext}"`;
}

function getOptions(name: string, options?: OptionsSync): Required<OptionsSync>;
function getOptions(name: string, options?: Options): Required<Options>;
function getOptions(
    name: string,
    options: Options | OptionsSync = {},
): Required<Options | OptionsSync> {
    const conf: Required<Options> = {
        stopDir: os.homedir(),
        searchPlaces: getDefaultSearchPlaces(name),
        ignoreEmptySearchPlaces: true,
        transform: (x: LilconfigResult): LilconfigResult => x,
        packageProp: [name],
        ...options,
        loaders: {...defaultLoaders, ...options.loaders},
    };
    conf.searchPlaces.forEach(place => {
        const key = path.extname(place) || 'noExt';
        const loader = conf.loaders[key];
        if (!loader) {
            throw new Error(
                `No loader specified for ${getExtDesc(
                    key,
                )}, so searchPlaces item "${place}" is invalid`,
            );
        }

        if (typeof loader !== 'function') {
            throw new Error(
                `loader for ${getExtDesc(
                    key,
                )} is not a function (type provided: "${typeof loader}"), so searchPlaces item "${place}" is invalid`,
            );
        }
    });

    return conf;
}

function getPackageProp(
    props: string | string[],
    obj: Record<string, unknown>,
): unknown {
    if (typeof props === 'string' && props in obj) return obj[props];
    return (
        (Array.isArray(props) ? props : props.split('.')).reduce(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (acc: any, prop): unknown => (acc === undefined ? acc : acc[prop]),
            obj,
        ) || null
    );
}

type SearchItem = {
    filepath: string;
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
                filepath: path.join(searchPath, fileName),
                loaderKey: path.extname(fileName) || 'noExt',
            }),
        );

        return acc;
    }, []);
}

function validateFilePath(filepath: string): void {
    if (!filepath) throw new Error('load must pass a non-empty string');
}

function validateLoader(loader: Loader, ext: string): void | never {
    if (!loader) throw new Error(`No loader specified for extension "${ext}"`);
    if (typeof loader !== 'function')
        throw new Error('loader is not a function');
}

type AsyncSearcher = {
    search(searchFrom?: string): Promise<LilconfigResult>;
    load(filepath: string): Promise<LilconfigResult>;
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
                filepath: '',
            };

            const searchItems = getSearchItems(searchPlaces, searchPaths);
            for (const {fileName, filepath, loaderKey} of searchItems) {
                try {
                    await fs.promises.access(filepath);
                } catch {
                    continue;
                }
                const content = String(await fsReadFileAsync(filepath));
                const loader = loaders[loaderKey];

                // handle package.json
                if (fileName === 'package.json') {
                    const pkg = loader(filepath, content);
                    const maybeConfig = getPackageProp(packageProp, pkg);
                    if (maybeConfig != null) {
                        result.config = maybeConfig;
                        result.filepath = filepath;
                        break;
                    }

                    continue;
                }

                // handle other type of configs
                const isEmpty = content.trim() === '';
                if (isEmpty && ignoreEmptySearchPlaces) continue;

                if (isEmpty) {
                    result.isEmpty = true;
                    result.config = undefined;
                } else {
                    validateLoader(loader, loaderKey);
                    result.config = loader(filepath, content);
                }
                result.filepath = filepath;
                break;
            }

            // not found
            if (result.filepath === '' && result.config === null)
                return transform(null);

            return transform(result);
        },
        async load(filepath: string): Promise<LilconfigResult> {
            validateFilePath(filepath);
            const {base, ext} = path.parse(filepath);
            const loaderKey = ext || 'noExt';
            const loader = loaders[loaderKey];
            validateLoader(loader, loaderKey);
            const content = String(await fsReadFileAsync(filepath));

            if (base === 'package.json') {
                const pkg = await loader(filepath, content);
                return transform({
                    config: getPackageProp(packageProp, pkg),
                    filepath,
                });
            }
            const result: LilconfigResult = {
                config: null,
                filepath,
            };
            // handle other type of configs
            const isEmpty = content.trim() === '';
            if (isEmpty && ignoreEmptySearchPlaces)
                return transform({
                    config: undefined,
                    filepath,
                    isEmpty: true,
                });

            // cosmiconfig returns undefined for empty files
            result.config = isEmpty
                ? undefined
                : await loader(filepath, content);

            return transform(
                isEmpty ? {...result, isEmpty, config: undefined} : result,
            );
        },
    };
}

type SyncSearcher = {
    search(searchFrom?: string): LilconfigResult;
    load(filepath: string): LilconfigResult;
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
                filepath: '',
            };

            const searchItems = getSearchItems(searchPlaces, searchPaths);
            for (const {fileName, filepath, loaderKey} of searchItems) {
                if (!fs.existsSync(filepath)) continue;
                const loader = loaders[loaderKey];
                const content = String(fs.readFileSync(filepath));

                // handle package.json
                if (fileName === 'package.json') {
                    const pkg = loader(filepath, content);
                    const maybeConfig = getPackageProp(packageProp, pkg);
                    if (maybeConfig != null) {
                        result.config = maybeConfig;
                        result.filepath = filepath;
                        break;
                    }

                    continue;
                }

                // handle other type of configs
                const isEmpty = content.trim() === '';
                if (isEmpty && ignoreEmptySearchPlaces) continue;

                if (isEmpty) {
                    result.isEmpty = true;
                    result.config = undefined;
                } else {
                    validateLoader(loader, loaderKey);
                    result.config = loader(filepath, content);
                }
                result.filepath = filepath;
                break;
            }

            // not found
            if (result.filepath === '' && result.config === null)
                return transform(null);

            return transform(result);
        },
        load(filepath: string): LilconfigResult {
            validateFilePath(filepath);
            const {base, ext} = path.parse(filepath);
            const loaderKey = ext || 'noExt';
            const loader = loaders[loaderKey];
            validateLoader(loader, loaderKey);

            const content = String(fs.readFileSync(filepath));

            if (base === 'package.json') {
                const pkg = loader(filepath, content);
                return transform({
                    config: getPackageProp(packageProp, pkg),
                    filepath,
                });
            }
            const result: LilconfigResult = {
                config: null,
                filepath,
            };
            // handle other type of configs
            const isEmpty = content.trim() === '';
            if (isEmpty && ignoreEmptySearchPlaces)
                return transform({
                    filepath,
                    config: undefined,
                    isEmpty: true,
                });

            // cosmiconfig returns undefined for empty files
            result.config = isEmpty ? undefined : loader(filepath, content);

            return transform(
                isEmpty ? {...result, isEmpty, config: undefined} : result,
            );
        },
    };
}
