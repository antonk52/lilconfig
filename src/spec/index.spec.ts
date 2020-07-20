import * as path from 'path';
import {lilconfig, lilconfigSync, LoaderSync, TransformSync} from '..';
import {cosmiconfig, cosmiconfigSync} from 'cosmiconfig';
import {transpileModule} from 'typescript';

describe('options', () => {
    const dirname = path.join(__dirname, 'load');

    describe('loaders', () => {
        const tsLoader: LoaderSync = (_, content) => {
            const res = transpileModule(content, {}).outputText;
            return eval(res);
        };

        describe('ts-loader', () => {
            const filepath = path.join(dirname, 'test-app.ts');
            const options = {
                loaders: {
                    '.ts': tsLoader,
                },
            };
            const expected = {
                config: {
                    typescript: true,
                },
                filepath,
            };

            it('sync', () => {
                const result = lilconfigSync('test-app', options).load(
                    filepath,
                );
                const ccResult = cosmiconfigSync('test-app', options).load(
                    filepath,
                );

                expect(result).toEqual(expected);
                expect(ccResult).toEqual(expected);
            });

            it('async', async () => {
                const result = await lilconfig('test-app', options).load(
                    filepath,
                );
                const ccResult = await cosmiconfig('test-app', options).load(
                    filepath,
                );

                expect(result).toEqual(expected);
                expect(ccResult).toEqual(expected);
            });
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
        const filepath = path.join(dirname, 'test-app.js');
        const options = {
            transform,
        };
        const expected = {
            config: {
                jsTest: true,
                transformed: true,
            },
            filepath,
        };

        it('sync', () => {
            const result = lilconfigSync('test-app', options).load(filepath);
            const ccResult = cosmiconfigSync('test-app', options).load(
                filepath,
            );

            expect(result).toEqual(expected);
            expect(ccResult).toEqual(expected);
        });
        it('async', async () => {
            const result = await lilconfig('test-app', options).load(filepath);
            const ccResult = await cosmiconfig('test-app', options).load(
                filepath,
            );

            expect(result).toEqual(expected);
            expect(ccResult).toEqual(expected);
        });
    });

    describe('ignoreEmptySearchPlaces', () => {
        const dirname = path.join(__dirname, 'load');
        const filepath = path.join(dirname, 'test-empty.js');

        describe('ignores by default', () => {
            it('sync', () => {
                const result = lilconfigSync('test-app').load(filepath);
                const ccResult = cosmiconfigSync('test-app').load(filepath);

                const expected = {
                    config: undefined,
                    filepath,
                    isEmpty: true,
                };

                expect(result).toEqual(expected);
                expect(ccResult).toEqual(expected);
            });

            it('async', async () => {
                const result = await lilconfig('test-app').load(filepath);
                const ccResult = await cosmiconfig('test-app').load(filepath);

                const expected = {
                    config: undefined,
                    filepath,
                    isEmpty: true,
                };

                expect(result).toEqual(expected);
                expect(ccResult).toEqual(expected);
            });
        });

        describe('ignores when true', () => {
            it('sync', () => {
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

            it('async', async () => {
                const options = {
                    ignoreEmptySearchPlaces: true,
                };
                const result = await lilconfig('test-app', options).load(
                    filepath,
                );
                const ccResult = await cosmiconfig('test-app', options).load(
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
        });

        describe('doesnt ignore when false', () => {
            it('sync', () => {
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

            it('async', async () => {
                const options = {
                    ignoreEmptySearchPlaces: false,
                };
                const result = await lilconfig('test-app', options).load(
                    filepath,
                );
                const ccResult = await cosmiconfig('test-app', options).load(
                    filepath,
                );

                const expected = {config: undefined, filepath, isEmpty: true};

                expect(result).toEqual(expected);
                expect(ccResult).toEqual(expected);
            });
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
        const searchPlaces = ['searchPlaces.conf.js', 'searchPlaces-noExt'];

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

    describe('packageProp', () => {
        describe('plain property string', () => {
            const dirname = path.join(__dirname, 'load');
            const options = {packageProp: 'foo'};
            const filepath = path.join(dirname, 'package.json');
            const expected = {
                config: {
                    insideFoo: true,
                },
                filepath,
            };

            it('sync', () => {
                const result = lilconfigSync('foo', options).load(filepath);
                const ccResult = cosmiconfigSync('foo', options).load(filepath);

                expect(result).toEqual(expected);
                expect(ccResult).toEqual(expected);
            });
            it('async', async () => {
                const result = await lilconfig('foo', options).load(filepath);
                const ccResult = await cosmiconfig('foo', options).load(
                    filepath,
                );

                expect(result).toEqual(expected);
                expect(ccResult).toEqual(expected);
            });
        });

        describe('array of strings', () => {
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
            const expected = {
                config: {
                    insideBarBaz: true,
                },
                filepath,
            };

            it('sync', () => {
                const result = lilconfigSync('foo', options).load(filepath);
                const ccResult = cosmiconfigSync('foo', options).load(filepath);

                expect(result).toEqual(expected);
                expect(ccResult).toEqual(expected);
            });
            it('async', async () => {
                const result = await lilconfig('foo', options).load(filepath);
                const ccResult = await cosmiconfig('foo', options).load(
                    filepath,
                );

                expect(result).toEqual(expected);
                expect(ccResult).toEqual(expected);
            });
        });

        // TODO think about throwing
        describe('string[] with null in the middle', () => {
            const searchFrom = path.join(__dirname, 'search', 'a', 'b', 'c');
            const options = {
                packageProp: 'bar.baz',
                stopDir: path.join(__dirname, 'search'),
            };
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

            it('sync', () => {
                const result = lilconfigSync('foo', options).search(searchFrom);

                expect(result).toEqual(expected);
            });
            it('async', async () => {
                const result = await lilconfig('foo', options).search(
                    searchFrom,
                );

                expect(result).toEqual(expected);
            });
        });
    });
});
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

    describe('search', () => {
        const dirname = path.join(__dirname, 'search');

        it('default for searchFrom', () => {
            const result = lilconfigSync('non-existent').search();
            const ccResult = cosmiconfigSync('non-existent').search();

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

        it('no extension loader throws for unparsable file', () => {
            const filepath = path.join(
                __dirname,
                'load',
                'test-noExt-nonParsable',
            );

            expect(() => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                lilconfigSync('test-app').load(filepath);
            }).toThrowError('Unexpected token # in JSON at position 2');
            expect(() => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                cosmiconfigSync('test-app').load(filepath);
            }).toThrowError(`YAML Error in ${filepath}`);
        });

        it('throws for empty strings passed to load', () => {
            const errMsg = 'load must pass a non-empty string';

            expect(() => {
                lilconfigSync('test-app').load('');
            }).toThrowError(errMsg);
            expect(() => {
                cosmiconfigSync('test-app').load('');
            }).toThrowError(errMsg);
        });

        it('throws when provided searchPlace has no loader', () => {
            const errMsg =
                'No loader specified for extension ".coffee", so searchPlaces item "file.coffee" is invalid';
            expect(() => {
                lilconfigSync('foo', {
                    searchPlaces: ['file.coffee'],
                });
            }).toThrowError(errMsg);
            expect(() => {
                cosmiconfigSync('foo', {
                    searchPlaces: ['file.coffee'],
                });
            }).toThrowError(errMsg);
        });

        it('throws when a loader for a searchPlace is not a function', () => {
            const errMsg =
                'loader for extension ".js" is not a function (type provided: "object"), so searchPlaces item "file.js" is invalid';
            const options = {
                searchPlaces: ['file.js'],
                loaders: {
                    '.js': {},
                },
            };
            expect(() => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                lilconfigSync('foo', options);
            }).toThrowError(errMsg);
            expect(() => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                cosmiconfigSync('foo', options);
            }).toThrowError(errMsg);
        });

        it('throws for searchPlaces with no extension', () => {
            const errMsg =
                'loader for files without extensions is not a function (type provided: "object"), so searchPlaces item "file" is invalid';
            const options = {
                searchPlaces: ['file'],
                loaders: {
                    noExt: {},
                },
            };
            expect(() => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                lilconfigSync('foo', options);
            }).toThrowError(errMsg);
            expect(() => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                cosmiconfigSync('foo', options);
            }).toThrowError(errMsg);
        });
    });
});

describe('lilconfig', () => {
    describe('load', () => {
        const dirname = path.join(__dirname, 'load');

        it('existing js file', async () => {
            const filepath = path.join(dirname, 'test-app.js');
            const result = await lilconfig('test-app').load(filepath);
            const ccResult = await cosmiconfig('test-app').load(filepath);

            const expected = {
                config: {jsTest: true},
                filepath,
            };

            expect(result).toEqual(expected);
            expect(result).toEqual(ccResult);
        });

        it('existing json file', async () => {
            const filepath = path.join(dirname, 'test-app.json');
            const result = await lilconfig('test-app').load(filepath);
            const ccResult = await cosmiconfig('test-app').load(filepath);

            const expected = {
                config: {jsonTest: true},
                filepath,
            };

            expect(result).toEqual(expected);
            expect(result).toEqual(ccResult);
        });

        it('no extension json file', async () => {
            const filepath = path.join(dirname, 'test-noExt-json');

            const result = await lilconfig('test-app').load(filepath);
            const ccResult = await cosmiconfig('test-app').load(filepath);

            const expected = {
                config: {noExtJsonFile: true},
                filepath,
            };

            expect(result).toEqual(expected);
            expect(result).toEqual(ccResult);
        });

        it('package.json', async () => {
            const filepath = path.join(dirname, 'package.json');
            const options = {};
            const result = await lilconfig('test-app', options).load(filepath);
            const ccResult = await cosmiconfig('test-app', options).load(
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

    describe('search', () => {
        const dirname = path.join(__dirname, 'search');

        it('returns null when no config found', async () => {
            const result = await lilconfig('non-existent').search();
            const ccResult = await cosmiconfig('non-existent').search();

            const expected = null;

            expect(result).toEqual(expected);
            expect(ccResult).toEqual(expected);
        });

        it('provided searchFrom', async () => {
            const searchFrom = path.join(dirname, 'a', 'b', 'c');

            const options = {
                stopDir: dirname,
            };

            const result = await lilconfig('non-existent', options).search(
                searchFrom,
            );
            const ccResult = await cosmiconfig('non-existent', options).search(
                searchFrom,
            );

            const expected = null;

            expect(result).toEqual(expected);
            expect(ccResult).toEqual(expected);
        });

        it('treating empty configs', async () => {
            const searchFrom = path.join(dirname, 'a', 'b', 'c');

            const options = {
                stopDir: dirname,
            };

            const result = await lilconfig('maybeEmpty', options).search(
                searchFrom,
            );
            const ccResult = await cosmiconfig('maybeEmpty', options).search(
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

        it('treating empty configs with ignoreEmptySearchPlaces off', async () => {
            const searchFrom = path.join(dirname, 'a', 'b', 'c');

            const options = {
                stopDir: dirname,
                ignoreEmptySearchPlaces: false,
            };

            const result = await lilconfig('maybeEmpty', options).search(
                searchFrom,
            );
            const ccResult = await cosmiconfig('maybeEmpty', options).search(
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
        it('loader throws', async () => {
            const dirname = path.join(__dirname, 'search');
            const searchFrom = path.join(dirname, 'a', 'b', 'c');

            class LoaderError extends Error {}

            const options = {
                loaders: {
                    '.js': (): void => {
                        throw new LoaderError();
                    },
                },
            };

            const result = await lilconfig('maybeEmpty', options)
                .search(searchFrom)
                .catch(x => x);
            const ccResult = await cosmiconfig('maybeEmpty', options)
                .search(searchFrom)
                .catch(x => x);

            expect(result instanceof LoaderError).toBeTruthy();
            expect(ccResult instanceof LoaderError).toBeTruthy();
        });

        it('non existing file', async () => {
            const dirname = path.join(__dirname, 'load');
            const filepath = path.join(dirname, 'nope.json');

            const errMsg = `ENOENT: no such file or directory, open '${filepath}'`;

            expect(lilconfig('test-app').load(filepath)).rejects.toThrowError(
                errMsg,
            );

            expect(cosmiconfig('test-app').load(filepath)).rejects.toThrowError(
                errMsg,
            );
        });

        it('throws for invalid json', async () => {
            const dirname = path.join(__dirname, 'load');
            const filepath = path.join(dirname, 'test-invalid.json');

            /**
             * throws but less elegant
             */
            expect(lilconfig('test-app').load(filepath)).rejects.toThrowError(
                "Cannot read property 'JSON' of null",
            );

            expect(cosmiconfig('test-app').load(filepath)).rejects.toThrowError(
                `JSON Error in ${filepath}:`,
            );
        });

        it('throws for provided filepath that does not exist', async () => {
            const dirname = path.join(__dirname, 'load');
            const filepath = path.join(dirname, 'i-do-no-exist.js');
            const errMsg = `ENOENT: no such file or directory, open '${filepath}'`;

            expect(
                lilconfig('test-app', {}).load(filepath),
            ).rejects.toThrowError(errMsg);
            expect(
                cosmiconfig('test-app', {}).load(filepath),
            ).rejects.toThrowError(errMsg);
        });

        it('no loader specified for the search place', async () => {
            const filepath = path.join(__dirname, 'load', 'config.coffee');

            const errMsg = 'No loader specified for extension ".coffee"';

            expect(lilconfig('test-app').load(filepath)).rejects.toThrowError(
                errMsg,
            );
            expect(cosmiconfig('test-app').load(filepath)).rejects.toThrowError(
                errMsg,
            );
        });

        it('loader is not a function', async () => {
            const filepath = path.join(__dirname, 'load', 'config.coffee');
            const options = {
                loaders: {
                    '.coffee': true,
                },
            };

            const errMsg = 'loader is not a function';

            expect(
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                lilconfig('test-app', options).load(filepath),
            ).rejects.toThrowError(errMsg);
            expect(
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                cosmiconfig('test-app', options).load(filepath),
            ).rejects.toThrowError(errMsg);
        });

        it('no extension loader throws for unparsable file', async () => {
            const filepath = path.join(
                __dirname,
                'load',
                'test-noExt-nonParsable',
            );

            expect(
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                lilconfig('test-app').load(filepath),
            ).rejects.toThrowError('Unexpected token # in JSON at position 2');
            expect(
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                cosmiconfig('test-app').load(filepath),
            ).rejects.toThrowError(`YAML Error in ${filepath}`);
        });

        it('throws for empty strings passed to load', async () => {
            const errMsg = 'load must pass a non-empty string';

            expect(lilconfig('test-app').load('')).rejects.toThrowError(errMsg);
            expect(cosmiconfig('test-app').load('')).rejects.toThrowError(
                errMsg,
            );
        });

        it('throws when provided searchPlace has no loader', () => {
            const errMsg =
                'No loader specified for extension ".coffee", so searchPlaces item "file.coffee" is invalid';
            expect(() =>
                lilconfig('foo', {
                    searchPlaces: ['file.coffee'],
                }),
            ).toThrowError(errMsg);
            expect(() =>
                cosmiconfig('foo', {
                    searchPlaces: ['file.coffee'],
                }),
            ).toThrowError(errMsg);
        });

        it('throws when a loader for a searchPlace is not a function', () => {
            const errMsg =
                'loader for extension ".js" is not a function (type provided: "object"), so searchPlaces item "file.js" is invalid';
            const options = {
                searchPlaces: ['file.js'],
                loaders: {
                    '.js': {},
                },
            };
            expect(() =>
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                lilconfig('foo', options),
            ).toThrowError(errMsg);
            expect(() =>
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                cosmiconfig('foo', options),
            ).toThrowError(errMsg);
        });

        it('throws for searchPlaces with no extension', () => {
            const errMsg =
                'loader for files without extensions is not a function (type provided: "object"), so searchPlaces item "file" is invalid';
            const options = {
                searchPlaces: ['file'],
                loaders: {
                    noExt: {},
                },
            };
            expect(() => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                lilconfig('foo', options);
            }).toThrowError(errMsg);
            expect(() => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                cosmiconfig('foo', options);
            }).toThrowError(errMsg);
        });
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
