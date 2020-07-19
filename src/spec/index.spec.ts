import * as path from 'path';
import {lilconfigSync, LoaderSync, TransformSync} from '..';
import {cosmiconfigSync} from 'cosmiconfig';
import {transpileModule} from 'typescript';

describe('lilconfigSync', () => {
    describe('load', () => {
        const dirname = path.join(__dirname, 'load');

        it('existing js file', () => {
            const filepath = path.join(dirname, 'test-app.js');
            const result = lilconfigSync('test-app').load(filepath);
            const ccResult = cosmiconfigSync('test-app').load(filepath);

            const expected = {
                config: {jsTest: true},
                filepath,
            };

            expect(result).toEqual(expected);
            expect(result).toEqual(ccResult);
        });

        it('existing json file', () => {
            const filepath = path.join(dirname, 'test-app.json');
            const result = lilconfigSync('test-app').load(filepath);
            const ccResult = cosmiconfigSync('test-app').load(filepath);

            const expected = {
                config: {jsonTest: true},
                filepath,
            };

            expect(result).toEqual(expected);
            expect(result).toEqual(ccResult);
        });

        it('no extension json file', () => {
            const filepath = path.join(dirname, 'test-noExt-json');

            const result = lilconfigSync('test-app').load(filepath);
            const ccResult = cosmiconfigSync('test-app').load(filepath);

            const expected = {
                config: {noExtJsonFile: true},
                filepath,
            };

            expect(result).toEqual(expected);
            expect(result).toEqual(ccResult);
        });

        it('no extension yaml file', () => {
            const filepath = path.join(dirname, 'test-noExt-yaml');

            const result = lilconfigSync('test-app').load(filepath);
            const ccResult = cosmiconfigSync('test-app').load(filepath);

            expect(result).toEqual({
                config: null,
                filepath,
            });
            expect(ccResult).toEqual({
                config: {
                    noExtYamlFile: true,
                },
                filepath,
            });
        });

        it('package.json', () => {
            const filepath = path.join(dirname, 'package.json');
            const options = {};
            const result = lilconfigSync('test-app', options).load(filepath);
            const ccResult = cosmiconfigSync('test-app', options).load(
                filepath,
            );

            const expected = {
                config: {
                    customThingHere: 'is-configured',
                },
                filepath,
            };

            expect(result).toEqual(expected);
            expect(ccResult).toEqual(expected);
        });
    });

    describe('options', () => {
        const dirname = path.join(__dirname, 'load');

        describe('loaders', () => {
            const tsLoader: LoaderSync = (_, content) => {
                const res = transpileModule(content, {}).outputText;
                return eval(res);
            };

            it('ts-loader', () => {
                const filepath = path.join(dirname, 'test-app.ts');
                const options = {
                    loaders: {
                        '.ts': tsLoader,
                    },
                };
                const result = lilconfigSync('test-app', options).load(
                    filepath,
                );
                const ccResult = cosmiconfigSync('test-app', options).load(
                    filepath,
                );

                const expected = {
                    config: {
                        typescript: true,
                    },
                    filepath,
                };

                expect(result).toEqual(expected);
                expect(ccResult).toEqual(expected);
            });
        });

        describe('transform', () => {
            const transform: TransformSync = result => {
                if (result == null) return null;
                return {
                    ...result,
                    config: {
                        ...result.config,
                        transformed: true,
                    },
                };
            };

            it('transforms config', () => {
                const filepath = path.join(dirname, 'test-app.js');
                const options = {
                    transform,
                };
                const result = lilconfigSync('test-app', options).load(
                    filepath,
                );
                const ccResult = cosmiconfigSync('test-app', options).load(
                    filepath,
                );

                const expected = {
                    config: {
                        jsTest: true,
                        transformed: true,
                    },
                    filepath,
                };

                expect(result).toEqual(expected);
                expect(ccResult).toEqual(expected);
            });
        });

        describe('ignoreEmptySearchPlaces', () => {
            it('does not ignore without the option', () => {
                const filepath = path.join(dirname, 'test-empty.js');
                const options = {};
                const result = lilconfigSync('test-app', options).load(
                    filepath,
                );
                const ccResult = cosmiconfigSync('test-app', options).load(
                    filepath,
                );

                const expected = {
                    config: undefined,
                    filepath,
                    isEmpty: true,
                };

                expect(result).toEqual(expected);
                expect(ccResult).toEqual(expected);
            });

            it('ignores when true', () => {
                const filepath = path.join(dirname, 'test-empty.js');
                const options = {
                    ignoreEmptySearchPlaces: true,
                };
                const result = lilconfigSync('test-app', options).load(
                    filepath,
                );
                const ccResult = cosmiconfigSync('test-app', options).load(
                    filepath,
                );

                const expected = {
                    config: undefined,
                    filepath,
                    isEmpty: true,
                };

                expect(result).toEqual(expected);
                expect(ccResult).toEqual(expected);
            });

            it('doesnt ignore when false', () => {
                const filepath = path.join(dirname, 'test-empty.js');
                const options = {
                    ignoreEmptySearchPlaces: false,
                };
                const result = lilconfigSync('test-app', options).load(
                    filepath,
                );
                const ccResult = cosmiconfigSync('test-app', options).load(
                    filepath,
                );

                const expected = {config: undefined, filepath, isEmpty: true};

                expect(result).toEqual(expected);
                expect(ccResult).toEqual(expected);
            });
        });

        it('stopDir', () => {
            const stopDir = path.join(__dirname, 'search');
            const searchFrom = path.join(__dirname, 'search', 'a', 'b', 'c');

            const result = lilconfigSync('non-existent', {stopDir}).search(
                searchFrom,
            );
            const ccResult = cosmiconfigSync('non-existent', {stopDir}).search(
                searchFrom,
            );

            const expected = null;

            expect(result).toEqual(expected);
            expect(ccResult).toEqual(expected);
        });

        it('searchPlaces', () => {
            const stopDir = path.join(__dirname, 'search');
            const searchFrom = path.join(__dirname, 'search', 'a', 'b', 'c');
            const searchPlaces = ['searchPlaces.conf.js'];

            const options = {
                stopDir,
                searchPlaces,
            };

            const result = lilconfigSync('doesnt-matter', options).search(
                searchFrom,
            );
            const ccResult = cosmiconfigSync('doesnt-matter', options).search(
                searchFrom,
            );

            const expected = {
                config: {
                    searchPlacesWorks: true,
                },
                filepath: path.join(
                    __dirname,
                    'search',
                    'a',
                    'b',
                    'searchPlaces.conf.js',
                ),
            };

            expect(result).toEqual(expected);
            expect(ccResult).toEqual(expected);
        });

        it('packageProp string', () => {
            const dirname = path.join(__dirname, 'load');
            const options = {packageProp: 'foo'};
            const filepath = path.join(dirname, 'package.json');
            const result = lilconfigSync('foo', options).load(filepath);
            const ccResult = cosmiconfigSync('foo', options).load(filepath);

            const expected = {
                config: {
                    insideFoo: true,
                },
                filepath,
            };

            expect(result).toEqual(expected);
            expect(ccResult).toEqual(expected);
        });

        it('packageProp string[]', () => {
            const filepath = path.join(
                __dirname,
                'search',
                'a',
                'package.json',
            );
            const options = {
                packageProp: 'bar.baz',
                stopDir: path.join(__dirname, 'search'),
            };
            const result = lilconfigSync('foo', options).load(filepath);
            const ccResult = cosmiconfigSync('foo', options).load(filepath);

            const expected = {
                config: {
                    insideBarBaz: true,
                },
                filepath,
            };

            expect(result).toEqual(expected);
            expect(ccResult).toEqual(expected);
        });

        // TODO think about throwing
        it('packageProp string[] with null in the middle', () => {
            const searchFrom = path.join(__dirname, 'search', 'a', 'b', 'c');
            const options = {
                packageProp: 'bar.baz',
                stopDir: path.join(__dirname, 'search'),
            };
            const result = lilconfigSync('foo', options).search(searchFrom);
            /**
             * cosmiconfig throws when there is `null` value
             * in the chain of package prop keys
             * const ccResult = cosmiconfigSync('foo', options).search(searchFrom);
             */

            const expected = {
                config: {
                    insideBarBaz: true,
                },
                filepath: path.join(__dirname, 'search', 'a', 'package.json'),
            };

            expect(result).toEqual(expected);
        });
    });

    describe('search', () => {
        const dirname = path.join(__dirname, 'search');

        it('default for searchFrom', () => {
            const options = {
                stopDir: dirname,
            };

            const result = lilconfigSync('non-existent', options).search();
            const ccResult = cosmiconfigSync('non-existent', options).search();

            const expected = null;

            expect(result).toEqual(expected);
            expect(ccResult).toEqual(expected);
        });

        it('provided searchFrom', () => {
            const searchFrom = path.join(dirname, 'a', 'b', 'c');

            const options = {
                stopDir: dirname,
            };

            const result = lilconfigSync('non-existent', options).search(
                searchFrom,
            );
            const ccResult = cosmiconfigSync('non-existent', options).search(
                searchFrom,
            );

            const expected = null;

            expect(result).toEqual(expected);
            expect(ccResult).toEqual(expected);
        });

        it('treating empty configs', () => {
            const searchFrom = path.join(dirname, 'a', 'b', 'c');

            const options = {
                stopDir: dirname,
            };

            const result = lilconfigSync('maybeEmpty', options).search(
                searchFrom,
            );
            const ccResult = cosmiconfigSync('maybeEmpty', options).search(
                searchFrom,
            );

            const expected = {
                config: {
                    notSoEmpty: true,
                },
                filepath: path.join(dirname, 'a', 'maybeEmpty.config.js'),
            };

            expect(result).toEqual(expected);
            expect(ccResult).toEqual(expected);
        });

        it('treating empty configs with ignoreEmptySearchPlaces off', () => {
            const searchFrom = path.join(dirname, 'a', 'b', 'c');

            const options = {
                stopDir: dirname,
                ignoreEmptySearchPlaces: false,
            };

            const result = lilconfigSync('maybeEmpty', options).search(
                searchFrom,
            );
            const ccResult = cosmiconfigSync('maybeEmpty', options).search(
                searchFrom,
            );

            const expected = {
                config: undefined,
                filepath: path.join(dirname, 'a', 'b', 'maybeEmpty.config.js'),
                isEmpty: true,
            };

            expect(result).toEqual(expected);
            expect(ccResult).toEqual(expected);
        });
    });

    describe('when to throw', () => {
        it('loader throws', () => {
            const dirname = path.join(__dirname, 'search');
            const searchFrom = path.join(dirname, 'a', 'b', 'c');

            class LoaderError extends Error {}

            const options = {
                loaders: {
                    '.js'(): void {
                        throw new LoaderError();
                    },
                },
            };

            expect(() => {
                lilconfigSync('maybeEmpty', options).search(searchFrom);
            }).toThrowError(LoaderError);
            expect(() => {
                cosmiconfigSync('maybeEmpty', options).search(searchFrom);
            }).toThrowError(LoaderError);
        });

        it('non existing file', () => {
            const dirname = path.join(__dirname, 'load');
            const filepath = path.join(dirname, 'nope.json');

            expect(() => {
                lilconfigSync('test-app').load(filepath);
            }).toThrowError(
                `ENOENT: no such file or directory, open '${filepath}'`,
            );

            expect(() => {
                cosmiconfigSync('test-app').load(filepath);
            }).toThrowError(
                `ENOENT: no such file or directory, open '${filepath}'`,
            );
        });

        it('throws for invalid json', () => {
            const dirname = path.join(__dirname, 'load');
            const filepath = path.join(dirname, 'test-invalid.json');

            /**
             * throws but less elegant
             */
            expect(() => {
                lilconfigSync('test-app').load(filepath);
            }).toThrowError('Unexpected token / in JSON at position 22');

            expect(() => {
                cosmiconfigSync('test-app').load(filepath);
            }).toThrowError(`JSON Error in ${filepath}:`);
        });

        it('no extension nonparsable file', () => {
            const dirname = path.join(__dirname, 'load');
            const filepath = path.join(dirname, 'test-noExt-nonparsable');

            const result = lilconfigSync('test-app').load(filepath);

            // TODO maybe throw for non parsable
            expect(result).toEqual({
                config: null,
                filepath,
            });
            expect(() => {
                cosmiconfigSync('test-app').load(filepath);
            }).toThrowError(`YAML Error in ${filepath}:`);
        });

        it('throws for provided filepath that does not exist', () => {
            const dirname = path.join(__dirname, 'load');
            const filepath = path.join(dirname, 'i-do-no-exist.js');
            const errMsg = `ENOENT: no such file or directory, open '${filepath}'`;

            expect(() => {
                lilconfigSync('test-app', {}).load(filepath);
            }).toThrowError(errMsg);
            expect(() => {
                cosmiconfigSync('test-app', {}).load(filepath);
            }).toThrowError(errMsg);
        });

        it('no loader specified for the search place', () => {
            const filepath = path.join(__dirname, 'load', 'config.coffee');

            const errMsg = 'No loader specified for extension ".coffee"';

            expect(() => {
                lilconfigSync('test-app').load(filepath);
            }).toThrowError(errMsg);
            expect(() => {
                cosmiconfigSync('test-app').load(filepath);
            }).toThrowError(errMsg);
        });

        it('loader is not a function', () => {
            const filepath = path.join(__dirname, 'load', 'config.coffee');
            const options = {
                loaders: {
                    '.coffee': true,
                },
            };

            const errMsg = 'loader is not a function';

            expect(() => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                lilconfigSync('test-app', options).load(filepath);
            }).toThrowError(errMsg);
            expect(() => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                cosmiconfigSync('test-app', options).load(filepath);
            }).toThrowError(errMsg);
        });

        // https://github.com/davidtheclark/cosmiconfig/blob/master/src/ExplorerBase.ts#L132
        // validate filepath for an empty string
        //
        // https://github.com/davidtheclark/cosmiconfig/blob/master/src/ExplorerBase.ts#L53
        // validate config
    });
});

describe('npm package api', () => {
    it('exports the same things as cosmiconfig', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const lc = require('../index');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const cc = require('cosmiconfig');

        const lcExplorerKeys = Object.keys(lc.lilconfig('foo'));
        const ccExplorerKeys = Object.keys(cc.cosmiconfig('foo'));

        expect(
            lcExplorerKeys.every((k: string) => ccExplorerKeys.includes(k)),
        ).toBe(true);

        const lcExplorerSyncKeys = Object.keys(lc.lilconfigSync('foo'));
        const ccExplorerSyncKeys = Object.keys(cc.cosmiconfigSync('foo'));

        expect(
            lcExplorerSyncKeys.every((k: string) =>
                ccExplorerSyncKeys.includes(k),
            ),
        ).toBe(true);

        /* eslint-disable @typescript-eslint/no-unused-vars */
        /* eslint-disable @typescript-eslint/ban-ts-ignore */
        const omitKnownDifferKeys = ({
            // @ts-ignore
            lilconfig,
            // @ts-ignore
            lilconfigSync,
            // @ts-ignore
            cosmiconfig,
            // @ts-ignore
            cosmiconfigSync,
            ...rest
        }): object => rest;
        /* eslint-enable @typescript-eslint/no-unused-vars */
        /* eslint-enable @typescript-eslint/ban-ts-ignore */

        expect(Object.keys(omitKnownDifferKeys(lc))).toEqual(
            Object.keys(omitKnownDifferKeys(cc)),
        );
    });
});
