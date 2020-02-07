import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * lilconfig intended to be a tiny drop in replacement for cosmiconfig
 * without yaml and noExt support
 */

type Result = null | {
    path: string;
    config: any;
    isEmpty?: boolean;
    error?: any;
};

// type LoaderSync = (filepath: string, content: string) => Object | null;
// type LoaderAsync = (filepath: string, content: string) => Object | null | Promise<Object | null>;
// type Loader = LoaderAsync | LoaderSync;

type Options = Partial<{
    stopDir: string;
    searchPlaces: string[];
    // loaders: Array<[string, Loader]>; // ???
    // cache: boolean;
    // transform: (result: Result) => Promise<Result> | Result;
    ignoreEmptySearchPlaces: boolean;
}>;

type SemiResult = {
    search: (searchFrom?: string) => Result;
    load: (filepath: string) => Result;
};

function getDefaultSearchPlaces(name: string): string[] {
    return [
        'package.json',
        `.${name}rc`,
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

function lilconfig(name: string, options: Options = {}): SemiResult {
    const {
        stopDir = os.homedir(),
        searchPlaces = getDefaultSearchPlaces(name),
        ignoreEmptySearchPlaces = true,
    } = options;


    return {
        search: (searchFrom = process.cwd()) => {
            const searchPaths = getSearchPaths(searchFrom, stopDir);

            const result: Result = {
                config: null,
                path: '',
            };

            let isConfigFound = false;

            for (const location of searchPaths) {
                if (isConfigFound) break;
                for (const fileName of searchPlaces) {
                    if (isConfigFound) break;

                    const filePath = path.join(location, fileName);

                    if (fs.existsSync(filePath)) {
                    // handle package.json
                        if (fileName === 'package.json') {
                            try {
                                const pkg = require(filePath);
                                if (name in pkg) {
                                    result.config = pkg[name];
                                    result.path = filePath;
                                    isConfigFound = true;
                                    break;
                                }
                            } catch (err) {}

                            continue;
                        }

                        // handle other type of configs
                        const content = fs.readFileSync(filePath).toString();
                        const isEmpty = !content
                            .split(os.EOL)
                            .map(x => x.trim())
                            .filter(Boolean).length;
                        if (isEmpty && ignoreEmptySearchPlaces) continue;
                        try {
                            result.config = require(filePath);
                            result.path = filePath;
                            if (isEmpty) result.isEmpty = isEmpty;
                        } catch (err) {
                            result.error = err;
                            result.config = null;
                        }
                        isConfigFound = true;
                        break;
                    }
                }
            }

            // not found
            if (result.path === '' && result.config === null) return null;

            return result;
        },
        load: filePath => {
            if (fs.existsSync(filePath)) {
                const {base} = path.parse(filePath);

                if (base === 'package.json') {
                    const pkg = require(filePath);
                    if (name in pkg) {
                        return {
                            config: pkg[name],
                            path: filePath,
                        };
                    }
                }
            }

            return null;
        },
    };

}

lilconfig('.synd', {stopDir: '/Users/antonk52'}).search();

export {lilconfig};
