// @ts-check
const path = require('path');
const fs = require('fs');
const {lilconfig, lilconfigSync} = require('..');
const {cosmiconfig, cosmiconfigSync} = require('cosmiconfig');
const {transpileModule} = require('typescript');

/**
 * Mocking fs solely to test the root directory filepath
 */
jest.mock('fs', () => {
	const fs = jest.requireActual('fs');

	return {
		...fs,
		promises: {
			...fs.promises,
			readFile: jest.fn(fs.promises.readFile),
			access: jest.fn(fs.promises.access),
		},
		accessSync: jest.fn(fs.accessSync),
		readFileSync: jest.fn(fs.readFileSync),
	};
});

beforeEach(() => {
	jest.clearAllMocks();
});

const isNodeV20orNewer = parseInt(process.versions.node, 10) >= 20;

describe('options', () => {
	const dirname = path.join(__dirname, 'load');

	describe('loaders', () => {
		/** @type {import('../index').LoaderSync} */
		const tsLoader = (_, content) => {
			const res = transpileModule(content, {}).outputText;
			return eval(res);
		};

		describe('ts-loader', () => {
			const filepath = path.join(dirname, 'test-app.ts');
			const relativeFilepath = filepath.slice(process.cwd().length + 1);
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
					relativeFilepath,
				);
				const ccResult = cosmiconfigSync('test-app', options).load(
					relativeFilepath,
				);

				expect(result).toEqual(expected);
				expect(ccResult).toEqual(expected);
			});

			it('async', async () => {
				const result = await lilconfig('test-app', options).load(
					relativeFilepath,
				);
				const ccResult = await cosmiconfig('test-app', options).load(
					relativeFilepath,
				);

				expect(result).toEqual(expected);
				expect(ccResult).toEqual(expected);
			});
		});

		describe('async loaders', () => {
			const config = {data: 42};
			const options = {
				loaders: {
					'.js': async () => config,

					/** @type {import('../index').LoaderSync} */
					noExt: (_, content) => content,
				},
			};

			it('async load', async () => {
				const filepath = path.join(__dirname, 'load', 'test-app.js');

				const result = await lilconfig('test-app', options).load(filepath);
				const ccResult = await cosmiconfig('test-app', options).load(filepath);

				expect(result).toEqual({config, filepath});
				expect(ccResult).toEqual({config, filepath});
			});

			it('async search', async () => {
				const searchPath = path.join(__dirname, 'search');
				const filepath = path.join(searchPath, 'test-app.config.js');

				const result = await lilconfig('test-app', options).search(searchPath);
				const ccResult = await cosmiconfig('test-app', options).search(
					searchPath,
				);

				expect(result).toEqual({config, filepath});
				expect(ccResult).toEqual({config, filepath});
			});

			describe('esm-project', () => {
				it('async search js', async () => {
					const stopDir = __dirname;
					const filepath = path.join(stopDir, 'esm-project', 'esm.config.js');
					const searchFrom = path.join(stopDir, 'esm-project', 'a', 'b', 'c');

					const options = {
						searchPlaces: ['esm.config.js'],
						stopDir,
					};

					const config = {esm: true};

					const result = await lilconfig('test-app', options).search(
						searchFrom,
					);
					const ccResult = await cosmiconfig('test-app', options).search(
						searchFrom,
					);

					expect(result).toEqual({config, filepath});
					expect(ccResult).toEqual({config, filepath});
				});

				it('async search mjs', async () => {
					const stopDir = __dirname;
					const filepath = path.join(stopDir, 'esm-project', 'esm.config.mjs');
					const searchFrom = path.join(stopDir, 'esm-project', 'a', 'b', 'c');

					const options = {
						searchPlaces: ['esm.config.mjs'],
						stopDir,
					};

					const config = {esm: true};

					const result = await lilconfig('test-app', options).search(
						searchFrom,
					);
					const ccResult = await cosmiconfig('test-app', options).search(
						searchFrom,
					);

					expect(result).toEqual({config, filepath});
					expect(ccResult).toEqual({config, filepath});
				});

				it('async search cjs', async () => {
					const stopDir = __dirname;
					const filepath = path.join(stopDir, 'esm-project', 'esm.config.cjs');
					const searchFrom = path.join(stopDir, 'esm-project', 'a', 'b', 'c');

					const options = {
						searchPlaces: ['esm.config.cjs'],
						stopDir,
					};

					const config = {cjs: true};

					const result = await lilconfig('test-app', options).search(
						searchFrom,
					);
					const ccResult = await cosmiconfig('test-app', options).search(
						searchFrom,
					);

					expect(result).toEqual({config, filepath});
					expect(ccResult).toEqual({config, filepath});
				});
				it('throws for using cjs instead of esm in esm project', async () => {
					const stopDir = __dirname;
					const filepath = path.join(stopDir, 'esm-project', 'cjs.config.mjs');

					const searcher = lilconfig('test-app', {});

					const err = await searcher.load(filepath).catch(e => e);
					expect(err.toString()).toMatch('module is not defined');
					// TODO test for cosmiconfig
					// cosmiconfig added this in v9.0.0
					// but also some breaking changes
				});
			});

			describe('cjs-project', () => {
				it('async search js', async () => {
					const stopDir = __dirname;
					const filepath = path.join(stopDir, 'cjs-project', 'cjs.config.js');
					const searchFrom = path.join(stopDir, 'cjs-project', 'a', 'b', 'c');

					const options = {
						searchPlaces: ['cjs.config.js'],
						stopDir,
					};

					const config = {cjs: true};

					const result = await lilconfig('test-app', options).search(
						searchFrom,
					);
					const ccResult = await cosmiconfig('test-app', options).search(
						searchFrom,
					);

					expect(result).toEqual({config, filepath});
					expect(ccResult).toEqual({config, filepath});
				});

				it('async search mjs', async () => {
					const stopDir = __dirname;
					const filepath = path.join(stopDir, 'cjs-project', 'cjs.config.mjs');
					const searchFrom = path.join(stopDir, 'cjs-project', 'a', 'b', 'c');

					const options = {
						searchPlaces: ['cjs.config.mjs'],
						stopDir,
					};

					const config = {esm: true};

					const result = await lilconfig('test-app', options).search(
						searchFrom,
					);
					const ccResult = await cosmiconfig('test-app', options).search(
						searchFrom,
					);

					expect(result).toEqual({config, filepath});
					expect(ccResult).toEqual({config, filepath});
				});

				it('async search cjs', async () => {
					const stopDir = __dirname;
					const filepath = path.join(stopDir, 'cjs-project', 'cjs.config.cjs');
					const searchFrom = path.join(stopDir, 'cjs-project', 'a', 'b', 'c');

					const options = {
						searchPlaces: ['cjs.config.cjs'],
						stopDir,
					};

					const config = {cjs: true};

					const result = await lilconfig('test-app', options).search(
						searchFrom,
					);
					const ccResult = await cosmiconfig('test-app', options).search(
						searchFrom,
					);

					expect(result).toEqual({config, filepath});
					expect(ccResult).toEqual({config, filepath});
				});
			});

			it('async noExt', async () => {
				const searchPath = path.join(__dirname, 'search');
				const filepath = path.join(searchPath, 'noExtension');
				const opts = {
					...options,
					searchPlaces: ['noExtension'],
				};

				const result = await lilconfig('noExtension', opts).search(searchPath);
				const ccResult = await cosmiconfig('noExtension', opts).search(
					searchPath,
				);

				const expected = {
					filepath,
					config: 'this file has no extension\n',
				};

				expect(result).toEqual(expected);
				expect(ccResult).toEqual(expected);
			});

			it('sync noExt', () => {
				const searchPath = path.join(__dirname, 'search');
				const filepath = path.join(searchPath, 'noExtension');
				const opts = {
					...options,
					searchPlaces: ['noExtension'],
				};

				const result = lilconfigSync('noExtension', opts).search(searchPath);
				const ccResult = cosmiconfigSync('noExtension', opts).search(
					searchPath,
				);

				const expected = {
					filepath,
					config: 'this file has no extension\n',
				};

				expect(result).toEqual(expected);
				expect(ccResult).toEqual(expected);
			});
		});
	});

	describe('transform', () => {
		/** @type {import('../index').TransformSync} */
		const transform = result => {
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
		const relativeFilepath = filepath.slice(process.cwd().length + 1);
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
			const result = lilconfigSync('test-app', options).load(relativeFilepath);
			const ccResult = cosmiconfigSync('test-app', options).load(
				relativeFilepath,
			);

			expect(result).toEqual(expected);
			expect(ccResult).toEqual(expected);
		});
		it('async', async () => {
			const result = await lilconfig('test-app', options).load(
				relativeFilepath,
			);
			const ccResult = await cosmiconfig('test-app', options).load(
				relativeFilepath,
			);

			expect(result).toEqual(expected);
			expect(ccResult).toEqual(expected);
		});
	});

	describe('ignoreEmptySearchPlaces', () => {
		const dirname = path.join(__dirname, 'load');
		const filepath = path.join(dirname, 'test-empty.js');
		const relativeFilepath = filepath.slice(process.cwd().length + 1);

		describe('ignores by default', () => {
			it('sync', () => {
				const result = lilconfigSync('test-app').load(relativeFilepath);
				const ccResult = cosmiconfigSync('test-app').load(relativeFilepath);

				const expected = {
					config: undefined,
					filepath,
					isEmpty: true,
				};

				expect(result).toEqual(expected);
				expect(ccResult).toEqual(expected);
			});

			it('async', async () => {
				const result = await lilconfig('test-app').load(relativeFilepath);
				const ccResult = await cosmiconfig('test-app').load(relativeFilepath);

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
				const result = lilconfigSync('test-app', options).load(filepath);
				const ccResult = cosmiconfigSync('test-app', options).load(filepath);

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
				const result = await lilconfig('test-app', options).load(filepath);
				const ccResult = await cosmiconfig('test-app', options).load(filepath);

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
				const result = lilconfigSync('test-app', options).load(filepath);
				const ccResult = cosmiconfigSync('test-app', options).load(filepath);

				const expected = {config: undefined, filepath, isEmpty: true};

				expect(result).toEqual(expected);
				expect(ccResult).toEqual(expected);
			});

			it('async', async () => {
				const options = {
					ignoreEmptySearchPlaces: false,
				};
				const result = await lilconfig('test-app', options).load(filepath);
				const ccResult = await cosmiconfig('test-app', options).load(filepath);

				const expected = {config: undefined, filepath, isEmpty: true};

				expect(result).toEqual(expected);
				expect(ccResult).toEqual(expected);
			});
		});
	});

	it('stopDir', () => {
		const stopDir = path.join(__dirname, 'search');
		const searchFrom = path.join(__dirname, 'search', 'a', 'b', 'c');

		const result = lilconfigSync('non-existent', {stopDir}).search(searchFrom);
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

		const result = lilconfigSync('doesnt-matter', options).search(searchFrom);
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

	describe('cache', () => {
		// running all checks in one to avoid resetting cache for fs.promises.access
		describe('enabled(default)', () => {
			it('async search()', async () => {
				const stopDir = path.join(__dirname, 'search');
				const searchFrom = path.join(stopDir, 'a', 'b', 'c');
				const searchPlaces = ['cached.config.js', 'package.json'];
				const searcher = lilconfig('cached', {
					cache: true,
					stopDir,
					searchPlaces,
				});
				const fsLookUps = () =>
					// @ts-expect-error
					fs.promises.access.mock.calls.length;

				expect(fsLookUps()).toBe(0);

				// per one search
				// for unexisting
				// (search + a + b + c) * times searchPlaces

				// for existing
				// (search + a + b + c) * (times searchPlaces - **first** matched)
				const expectedFsLookUps = 7;

				// initial search populates cache
				const result = await searcher.search(searchFrom);

				expect(fsLookUps()).toBe(expectedFsLookUps);

				// subsequant search reads from cache
				const result2 = await searcher.search(searchFrom);
				expect(fsLookUps()).toBe(expectedFsLookUps);
				expect(result).toEqual(result2);

				// searching a subpath reuses cache
				const result3 = await searcher.search(path.join(stopDir, 'a'));
				const result4 = await searcher.search(path.join(stopDir, 'a', 'b'));
				expect(fsLookUps()).toBe(expectedFsLookUps);
				expect(result2).toEqual(result3);
				expect(result3).toEqual(result4);

				// calling clearCaches empties search cache
				searcher.clearCaches();

				// emptied all caches, should perform new lookups
				const result5 = await searcher.search(searchFrom);
				expect(fsLookUps()).toBe(expectedFsLookUps * 2);
				expect(result4).toEqual(result5);
				// different references
				expect(result4 === result5).toEqual(false);

				searcher.clearSearchCache();
				const result6 = await searcher.search(searchFrom);
				expect(fsLookUps()).toBe(expectedFsLookUps * 3);
				expect(result5).toEqual(result6);
				// different references
				expect(result5 === result6).toEqual(false);

				// clearLoadCache does not clear search cache
				searcher.clearLoadCache();
				const result7 = await searcher.search(searchFrom);
				expect(fsLookUps()).toBe(expectedFsLookUps * 3);
				expect(result6).toEqual(result7);
				// same references
				expect(result6 === result7).toEqual(true);

				// searching a superset path will access fs until it hits a known path
				const result8 = await searcher.search(path.join(searchFrom, 'd'));
				expect(fsLookUps()).toBe(3 * expectedFsLookUps + 2);
				expect(result7).toEqual(result8);
				// same references
				expect(result7 === result8).toEqual(true);

				// repeated searches do not cause extra fs calls
				const result9 = await searcher.search(path.join(searchFrom, 'd'));
				expect(fsLookUps()).toBe(3 * expectedFsLookUps + 2);
				expect(result8).toEqual(result9);
				// same references
				expect(result8 === result9).toEqual(true);
			});

			it('sync search()', () => {
				const stopDir = path.join(__dirname, 'search');
				const searchFrom = path.join(stopDir, 'a', 'b', 'c');
				const searchPlaces = ['cached.config.js', 'package.json'];
				const searcher = lilconfigSync('cached', {
					cache: true,
					stopDir,
					searchPlaces,
				});
				const fsLookUps = () =>
					// @ts-expect-error
					fs.accessSync.mock.calls.length;

				expect(fsLookUps()).toBe(0);

				// per one search
				// for unexisting
				// (search + a + b + c) * times searchPlaces

				// for existing
				// (search + a + b + c) * (times searchPlaces - **first** matched)
				const expectedFsLookUps = 7;

				// initial search populates cache
				const result = searcher.search(searchFrom);

				expect(fsLookUps()).toBe(expectedFsLookUps);

				// subsequant search reads from cache
				const result2 = searcher.search(searchFrom);
				expect(fsLookUps()).toBe(expectedFsLookUps);
				expect(result).toEqual(result2);

				// searching a subpath reuses cache
				const result3 = searcher.search(path.join(stopDir, 'a'));
				const result4 = searcher.search(path.join(stopDir, 'a', 'b'));
				expect(fsLookUps()).toBe(expectedFsLookUps);
				expect(result2).toEqual(result3);
				expect(result3).toEqual(result4);

				// calling clearCaches empties search cache
				searcher.clearCaches();

				// emptied all caches, should perform new lookups
				const result5 = searcher.search(searchFrom);
				expect(fsLookUps()).toBe(expectedFsLookUps * 2);
				expect(result4).toEqual(result5);
				// different references
				expect(result4 === result5).toEqual(false);

				searcher.clearSearchCache();
				const result6 = searcher.search(searchFrom);
				expect(fsLookUps()).toBe(expectedFsLookUps * 3);
				expect(result5).toEqual(result6);
				// different references
				expect(result5 === result6).toEqual(false);

				// clearLoadCache does not clear search cache
				searcher.clearLoadCache();
				const result7 = searcher.search(searchFrom);
				expect(fsLookUps()).toBe(expectedFsLookUps * 3);
				expect(result6).toEqual(result7);
				// same references
				expect(result6 === result7).toEqual(true);

				// searching a superset path will access fs until it hits a known path
				const result8 = searcher.search(path.join(searchFrom, 'd'));
				expect(fsLookUps()).toBe(3 * expectedFsLookUps + 2);
				expect(result7).toEqual(result8);
				// same references
				expect(result7 === result8).toEqual(true);

				// repeated searches do not cause extra fs calls
				const result9 = searcher.search(path.join(searchFrom, 'd'));
				expect(fsLookUps()).toBe(3 * expectedFsLookUps + 2);
				expect(result8).toEqual(result9);
				// same references
				expect(result8 === result9).toEqual(true);
			});

			it('async load()', async () => {
				const stopDir = path.join(__dirname, 'search');
				const searchPlaces = ['cached.config.js', 'package.json'];
				const searcher = lilconfig('cached', {
					cache: true,
					stopDir,
					searchPlaces,
				});
				const existingFile = path.join(stopDir, 'cached.config.js');
				const fsReadFileCalls = () =>
					// @ts-expect-error
					fs.promises.readFile.mock.calls.length;

				expect(fsReadFileCalls()).toBe(0);

				// initial search populates cache
				const result = await searcher.load(existingFile);
				expect(fsReadFileCalls()).toBe(1);

				// subsequant load reads from cache
				const result2 = await searcher.load(existingFile);
				expect(fsReadFileCalls()).toBe(1);
				expect(result).toEqual(result2);
				// same reference
				expect(result === result2).toEqual(true);

				// calling clearCaches empties search cache
				searcher.clearCaches();
				const result3 = await searcher.load(existingFile);
				expect(fsReadFileCalls()).toBe(2);
				expect(result2).toEqual(result3);
				// different reference
				expect(result2 === result3).toEqual(false);

				searcher.clearLoadCache();
				const result4 = await searcher.load(existingFile);
				expect(fsReadFileCalls()).toBe(3);
				expect(result3).toEqual(result4);
				// different reference
				expect(result3 === result4).toEqual(false);

				// clearLoadCache does not clear search cache
				searcher.clearSearchCache();
				const result5 = await searcher.load(existingFile);
				expect(fsReadFileCalls()).toBe(3);
				expect(result4).toEqual(result5);
				// same reference
				expect(result4 === result5).toEqual(true);
			});

			it('sync load()', () => {
				const stopDir = path.join(__dirname, 'search');
				const searchPlaces = ['cached.config.js', 'package.json'];
				const searcher = lilconfigSync('cached', {
					cache: true,
					stopDir,
					searchPlaces,
				});
				const existingFile = path.join(stopDir, 'cached.config.js');
				const fsReadFileCalls = () =>
					// @ts-expect-error
					fs.readFileSync.mock.calls.length;

				expect(fsReadFileCalls()).toBe(0);

				// initial search populates cache
				const result = searcher.load(existingFile);
				expect(fsReadFileCalls()).toBe(1);

				// subsequant load reads from cache
				const result2 = searcher.load(existingFile);
				expect(fsReadFileCalls()).toBe(1);
				expect(result).toEqual(result2);
				// same reference
				expect(result === result2).toEqual(true);

				// calling clearCaches empties search cache
				searcher.clearCaches();
				const result3 = searcher.load(existingFile);
				expect(fsReadFileCalls()).toBe(2);
				expect(result2).toEqual(result3);
				// different reference
				expect(result2 === result3).toEqual(false);

				searcher.clearLoadCache();
				const result4 = searcher.load(existingFile);
				expect(fsReadFileCalls()).toBe(3);
				expect(result3).toEqual(result4);
				// different reference
				expect(result3 === result4).toEqual(false);

				// clearLoadCache does not clear search cache
				searcher.clearSearchCache();
				const result5 = searcher.load(existingFile);
				expect(fsReadFileCalls()).toBe(3);
				expect(result4).toEqual(result5);
				// same reference
				expect(result4 === result5).toEqual(true);
			});
		});
		describe('disabled', () => {
			it('async search()', async () => {
				const stopDir = path.join(__dirname, 'search');
				const searchFrom = path.join(stopDir, 'a', 'b', 'c');
				const searchPlaces = ['cached.config.js', 'package.json'];
				const searcher = lilconfig('cached', {
					cache: false,
					stopDir,
					searchPlaces,
				});
				const fsLookUps = () =>
					// @ts-expect-error
					fs.promises.access.mock.calls.length;

				expect(fsLookUps()).toBe(0);

				const expectedFsLookUps = 7;

				// initial search populates cache
				const result = await searcher.search(searchFrom);

				expect(fsLookUps()).toBe(expectedFsLookUps);

				// subsequant search reads from cache
				const result2 = await searcher.search(searchFrom);
				expect(fsLookUps()).toBe(expectedFsLookUps * 2);
				expect(result).toEqual(result2);

				expect(result2 === result).toBe(false);
			});

			it('sync search()', () => {
				const stopDir = path.join(__dirname, 'search');
				const searchFrom = path.join(stopDir, 'a', 'b', 'c');
				const searchPlaces = ['cached.config.js', 'package.json'];
				const searcher = lilconfigSync('cached', {
					cache: false,
					stopDir,
					searchPlaces,
				});
				const fsLookUps = () =>
					// @ts-expect-error
					fs.accessSync.mock.calls.length;

				expect(fsLookUps()).toBe(0);

				const expectedFsLookUps = 7;

				// initial search populates cache
				const result = searcher.search(searchFrom);

				expect(fsLookUps()).toBe(expectedFsLookUps);

				// subsequent search reads from cache
				const result2 = searcher.search(searchFrom);
				expect(fsLookUps()).toBe(expectedFsLookUps * 2);
				expect(result).toEqual(result2);

				expect(result2 === result).toBe(false);
			});

			it('async load()', async () => {
				const stopDir = path.join(__dirname, 'search');
				const searchPlaces = ['cached.config.js', 'package.json'];
				const searcher = lilconfig('cached', {
					cache: false,
					stopDir,
					searchPlaces,
				});
				const existingFile = path.join(stopDir, 'cached.config.js');
				const fsReadFileCalls = () =>
					// @ts-expect-error
					fs.promises.readFile.mock.calls.length;

				expect(fsReadFileCalls()).toBe(0);

				// initial search populates cache
				const result = await searcher.load(existingFile);
				expect(fsReadFileCalls()).toBe(1);

				// subsequant load reads from cache
				const result2 = await searcher.load(existingFile);
				expect(fsReadFileCalls()).toBe(2);
				expect(result).toEqual(result2);
				// different reference
				expect(result === result2).toEqual(false);
			});

			it('sync load()', () => {
				const stopDir = path.join(__dirname, 'search');
				const searchPlaces = ['cached.config.js', 'package.json'];
				const searcher = lilconfigSync('cached', {
					cache: false,
					stopDir,
					searchPlaces,
				});
				const existingFile = path.join(stopDir, 'cached.config.js');
				const fsReadFileCalls = () =>
					// @ts-expect-error
					fs.readFileSync.mock.calls.length;

				expect(fsReadFileCalls()).toBe(0);

				// initial search populates cache
				const result = searcher.load(existingFile);
				expect(fsReadFileCalls()).toBe(1);

				// subsequant load reads from cache
				const result2 = searcher.load(existingFile);
				expect(fsReadFileCalls()).toBe(2);
				expect(result).toEqual(result2);
				// differnt reference
				expect(result === result2).toEqual(false);
			});
		});
	});

	describe('packageProp', () => {
		describe('plain property string', () => {
			const dirname = path.join(__dirname, 'load');
			const options = {packageProp: 'foo'};
			const filepath = path.join(dirname, 'package.json');
			const relativeFilepath = filepath.slice(process.cwd().length + 1);
			const expected = {
				config: {
					insideFoo: true,
				},
				filepath,
			};

			it('sync', () => {
				const result = lilconfigSync('foo', options).load(relativeFilepath);
				const ccResult = cosmiconfigSync('foo', options).load(relativeFilepath);

				expect(result).toEqual(expected);
				expect(ccResult).toEqual(expected);
			});
			it('async', async () => {
				const result = await lilconfig('foo', options).load(relativeFilepath);
				const ccResult = await cosmiconfig('foo', options).load(
					relativeFilepath,
				);

				expect(result).toEqual(expected);
				expect(ccResult).toEqual(expected);
			});
		});

		describe('array of strings', () => {
			const filepath = path.join(__dirname, 'search', 'a', 'package.json');
			const relativeFilepath = filepath.slice(process.cwd().length + 1);
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
				const result = lilconfigSync('foo', options).load(relativeFilepath);
				const ccResult = cosmiconfigSync('foo', options).load(relativeFilepath);

				expect(result).toEqual(expected);
				expect(ccResult).toEqual(expected);
			});
			it('async', async () => {
				const result = await lilconfig('foo', options).load(relativeFilepath);
				const ccResult = await cosmiconfig('foo', options).load(
					relativeFilepath,
				);

				expect(result).toEqual(expected);
				expect(ccResult).toEqual(expected);
			});
		});

		describe('string[] with null in the middle', () => {
			const searchFrom = path.join(__dirname, 'search', 'a', 'b', 'c');
			const options = {
				packageProp: 'bar.baz',
				stopDir: path.join(__dirname, 'search'),
			};
			/**
			 * cosmiconfig throws when there is `null` value in the chain of package prop keys
			 */

			const expectedMessage =
				parseInt(process.version.slice(1), 10) > 14
					? "Cannot read properties of null (reading 'baz')"
					: "Cannot read property 'baz' of null";

			it('sync', () => {
				expect(() => {
					lilconfigSync('foo', options).search(searchFrom);
				}).toThrowError(expectedMessage);
				expect(() => {
					cosmiconfigSync('foo', options).search(searchFrom);
				}).toThrowError(expectedMessage);
			});
			it('async', async () => {
				expect(
					lilconfig('foo', options).search(searchFrom),
				).rejects.toThrowError(expectedMessage);
				expect(
					cosmiconfig('foo', options).search(searchFrom),
				).rejects.toThrowError(expectedMessage);
			});
		});

		describe('string[] with result', () => {
			const searchFrom = path.join(__dirname, 'search', 'a', 'b', 'c');
			const options = {
				packageProp: 'zoo.foo',
				stopDir: path.join(__dirname, 'search'),
			};
			const expected = {
				config: {
					insideZooFoo: true,
				},
				filepath: path.join(__dirname, 'search', 'a', 'package.json'),
			};

			it('sync', () => {
				const result = lilconfigSync('foo', options).search(searchFrom);
				const ccResult = cosmiconfigSync('foo', options).search(searchFrom);

				expect(result).toEqual(expected);
				expect(ccResult).toEqual(expected);
			});
			it('async', async () => {
				const result = await lilconfig('foo', options).search(searchFrom);
				const ccResult = await cosmiconfig('foo', options).search(searchFrom);

				expect(result).toEqual(expected);
				expect(ccResult).toEqual(expected);
			});
		});
	});
});
describe('lilconfigSync', () => {
	describe('load', () => {
		const dirname = path.join(__dirname, 'load');

		it('existing js file', () => {
			const filepath = path.join(dirname, 'test-app.js');
			const relativeFilepath = filepath.slice(process.cwd().length + 1);

			const result = lilconfigSync('test-app').load(relativeFilepath);
			const ccResult = cosmiconfigSync('test-app').load(relativeFilepath);

			const expected = {
				config: {jsTest: true},
				filepath,
			};

			expect(result).toEqual(expected);
			expect(result).toEqual(ccResult);
		});

		it('existing cjs file', () => {
			const filepath = path.join(dirname, 'test-app.cjs');
			const relativeFilepath = filepath.slice(process.cwd().length + 1);

			const result = lilconfigSync('test-app').load(relativeFilepath);
			const ccResult = cosmiconfigSync('test-app').load(relativeFilepath);

			const expected = {
				config: {jsTest: true},
				filepath,
			};

			expect(result).toEqual(expected);
			expect(result).toEqual(ccResult);
		});

		it('existing json file', () => {
			const filepath = path.join(dirname, 'test-app.json');
			const relativeFilepath = filepath.slice(process.cwd().length + 1);

			const result = lilconfigSync('test-app').load(relativeFilepath);
			const ccResult = cosmiconfigSync('test-app').load(relativeFilepath);

			const expected = {
				config: {jsonTest: true},
				filepath,
			};

			expect(result).toEqual(expected);
			expect(result).toEqual(ccResult);
		});

		it('no extension json file', () => {
			const filepath = path.join(dirname, 'test-noExt-json');
			const relativeFilepath = filepath.slice(process.cwd().length + 1);

			const result = lilconfigSync('test-app').load(relativeFilepath);
			const ccResult = cosmiconfigSync('test-app').load(relativeFilepath);

			const expected = {
				config: {noExtJsonFile: true},
				filepath,
			};

			expect(result).toEqual(expected);
			expect(result).toEqual(ccResult);
		});

		it('package.json', () => {
			const filepath = path.join(dirname, 'package.json');
			const relativeFilepath = filepath.slice(process.cwd().length + 1);

			const options = {};
			const result = lilconfigSync('test-app', options).load(relativeFilepath);
			const ccResult = cosmiconfigSync('test-app', options).load(
				relativeFilepath,
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

		it('checks in hidden .config dir', () => {
			const searchFrom = path.join(dirname, 'a', 'b', 'c');

			const result = lilconfigSync('hidden').search(searchFrom);
			const ccResult = cosmiconfigSync('hidden').search(searchFrom);

			const expected = {hidden: true};

			expect(result?.config).toEqual(expected);
			expect(ccResult?.config).toEqual(expected);
		});

		if (process.platform !== 'win32') {
			it('default for searchFrom till root directory', () => {
				const options = {stopDir: '/'};
				const result = lilconfigSync('non-existent', options).search();
				expect(
					// @ts-expect-error
					fs.accessSync.mock.calls.slice(-10),
				).toEqual([
					['/package.json'],
					['/.non-existentrc.json'],
					['/.non-existentrc.js'],
					['/.non-existentrc.cjs'],
					['/.config/non-existentrc'],
					['/.config/non-existentrc.json'],
					['/.config/non-existentrc.js'],
					['/.config/non-existentrc.cjs'],
					['/non-existent.config.js'],
					['/non-existent.config.cjs'],
				]);
				const ccResult = cosmiconfigSync('non-existent', options).search();

				const expected = null;

				expect(result).toEqual(expected);
				expect(ccResult).toEqual(expected);
			});
		}

		it('provided searchFrom', () => {
			const searchFrom = path.join(dirname, 'a', 'b', 'c');

			const options = {
				stopDir: dirname,
			};

			const result = lilconfigSync('non-existent', options).search(searchFrom);
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

			const result = lilconfigSync('maybeEmpty', options).search(searchFrom);
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

			const result = lilconfigSync('maybeEmpty', options).search(searchFrom);
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
					'.js'() {
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
			const relativeFilepath = filepath.slice(process.cwd().length + 1);

			expect(() => {
				lilconfigSync('test-app').load(relativeFilepath);
			}).toThrowError(`ENOENT: no such file or directory, open '${filepath}'`);

			expect(() => {
				cosmiconfigSync('test-app').load(relativeFilepath);
			}).toThrowError(`ENOENT: no such file or directory, open '${filepath}'`);
		});

		it('throws for invalid json', () => {
			const dirname = path.join(__dirname, 'load');
			const filepath = path.join(dirname, 'test-invalid.json');
			const relativeFilepath = filepath.slice(process.cwd().length + 1);

			/**
			 * throws but less elegant
			 */
			expect(() => {
				lilconfigSync('test-app').load(relativeFilepath);
			}).toThrowError(
				isNodeV20orNewer
					? `Expected ',' or '}' after property value in JSON at position 22`
					: 'Unexpected token / in JSON at position 22',
			);

			expect(() => {
				cosmiconfigSync('test-app').load(relativeFilepath);
			}).toThrowError(`JSON Error in ${filepath}:`);
		});

		it('throws for provided filepath that does not exist', () => {
			const dirname = path.join(__dirname, 'load');
			const filepath = path.join(dirname, 'i-do-no-exist.js');
			const relativeFilepath = filepath.slice(process.cwd().length + 1);
			const errMsg = `ENOENT: no such file or directory, open '${filepath}'`;

			expect(() => {
				lilconfigSync('test-app', {}).load(relativeFilepath);
			}).toThrowError(errMsg);
			expect(() => {
				cosmiconfigSync('test-app', {}).load(relativeFilepath);
			}).toThrowError(errMsg);
		});

		it('no loader specified for the search place', () => {
			const filepath = path.join(__dirname, 'load', 'config.coffee');
			const relativeFilepath = filepath.slice(process.cwd().length + 1);

			const errMsg = 'No loader specified for extension ".coffee"';

			expect(() => {
				lilconfigSync('test-app').load(relativeFilepath);
			}).toThrowError(errMsg);
			expect(() => {
				cosmiconfigSync('test-app').load(relativeFilepath);
			}).toThrowError(errMsg);
		});

		it('loader is not a function', () => {
			const filepath = path.join(__dirname, 'load', 'config.coffee');
			const relativeFilepath = filepath.slice(process.cwd().length + 1);
			const options = {
				loaders: {
					'.coffee': true,
				},
			};

			const errMsg = 'loader is not a function';

			expect(() => {
				// @ts-expect-error: unit test is literally for this purpose
				lilconfigSync('test-app', options).load(relativeFilepath);
			}).toThrowError(errMsg);
			expect(() => {
				// @ts-ignore: unit test is literally for this purpose
				cosmiconfigSync('test-app', options).load(relativeFilepath);
			}).toThrowError(errMsg);
		});

		it('no extension loader throws for unparsable file', () => {
			const filepath = path.join(__dirname, 'load', 'test-noExt-nonParsable');
			const relativeFilepath = filepath.slice(process.cwd().length + 1);

			expect(() => {
				lilconfigSync('test-app').load(relativeFilepath);
			}).toThrowError(
				isNodeV20orNewer
					? `Unexpected token 'h', \"hobbies:\n- "Reading\n`
					: 'Unexpected token # in JSON at position 2',
			);
			expect(() => {
				cosmiconfigSync('test-app').load(relativeFilepath);
			}).toThrowError(`YAML Error in ${filepath}`);
		});

		it('throws for empty strings passed to load', () => {
			const errMsg = 'load must pass a non-empty string';

			expect(() => {
				lilconfigSync('test-app').load('');
			}).toThrowError(errMsg);
			expect(() => {
				cosmiconfigSync('test-app').load('');
			}).toThrowError('EISDIR: illegal operation on a directory, read');
		});

		it('throws when provided searchPlace has no loader', () => {
			const errMsg = 'Missing loader for extension "file.coffee"';
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
				'Loader for extension "file.js" is not a function: Received object.';
			const options = {
				searchPlaces: ['file.js'],
				loaders: {
					'.js': {},
				},
			};
			expect(() => {
				lilconfigSync(
					'foo',
					// @ts-expect-error: unit test is literally for this purpose
					options,
				);
			}).toThrowError(errMsg);
			expect(() => {
				cosmiconfigSync(
					'foo',
					// @ts-ignore: needed for jest
					options,
				);
			}).toThrowError(errMsg);
		});

		it('throws for searchPlaces with no extension', () => {
			const errMsg =
				'Loader for extension "file" is not a function: Received object.';
			const options = {
				searchPlaces: ['file'],
				loaders: {
					noExt: {},
				},
			};
			expect(() => {
				lilconfigSync(
					'foo',
					// @ts-expect-error: unit test is literally for this purpose
					options,
				);
			}).toThrowError(errMsg);
			expect(() => {
				cosmiconfigSync(
					'foo',
					// @ts-ignore: needed for jest
					options,
				);
			}).toThrowError(errMsg);
		});
	});
});

describe('lilconfig', () => {
	describe('load', () => {
		const dirname = path.join(__dirname, 'load');

		it('existing js file', async () => {
			const filepath = path.join(dirname, 'test-app.js');
			const relativeFilepath = filepath.slice(process.cwd().length + 1);
			const result = await lilconfig('test-app').load(relativeFilepath);
			const ccResult = await cosmiconfig('test-app').load(relativeFilepath);

			const expected = {
				config: {jsTest: true},
				filepath,
			};

			expect(result).toEqual(expected);
			expect(result).toEqual(ccResult);
		});

		it('existing cjs file', async () => {
			const filepath = path.join(dirname, 'test-app.cjs');
			const relativeFilepath = filepath.slice(process.cwd().length + 1);
			const result = await lilconfig('test-app').load(relativeFilepath);
			const ccResult = await cosmiconfig('test-app').load(relativeFilepath);

			const expected = {
				config: {jsTest: true},
				filepath,
			};

			expect(result).toEqual(expected);
			expect(result).toEqual(ccResult);
		});

		it('existing json file', async () => {
			const filepath = path.join(dirname, 'test-app.json');
			const relativeFilepath = filepath.slice(process.cwd().length + 1);
			const result = await lilconfig('test-app').load(relativeFilepath);
			const ccResult = await cosmiconfig('test-app').load(relativeFilepath);

			const expected = {
				config: {jsonTest: true},
				filepath,
			};

			expect(result).toEqual(expected);
			expect(result).toEqual(ccResult);
		});

		it('no extension json file', async () => {
			const filepath = path.join(dirname, 'test-noExt-json');
			const relativeFilepath = filepath.slice(process.cwd().length + 1);

			const result = await lilconfig('test-app').load(relativeFilepath);
			const ccResult = await cosmiconfig('test-app').load(relativeFilepath);

			const expected = {
				config: {noExtJsonFile: true},
				filepath,
			};

			expect(result).toEqual(expected);
			expect(result).toEqual(ccResult);
		});

		it('package.json', async () => {
			const filepath = path.join(dirname, 'package.json');
			const relativeFilepath = filepath.slice(process.cwd().length + 1);
			const options = {};
			const result = await lilconfig('test-app', options).load(
				relativeFilepath,
			);
			const ccResult = await cosmiconfig('test-app', options).load(
				relativeFilepath,
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

		it('checks in hidden .config dir', async () => {
			const searchFrom = path.join(dirname, 'a', 'b', 'c');

			const result = await lilconfig('hidden').search(searchFrom);
			const ccResult = await cosmiconfig('hidden').search(searchFrom);

			const expected = {hidden: true};

			expect(result?.config).toEqual(expected);
			expect(ccResult?.config).toEqual(expected);
		});

		if (process.platform !== 'win32') {
			it('searches root directory correctly', async () => {
				const options = {stopDir: '/'};
				const result = await lilconfig('non-existent', options).search();
				expect(
					// @ts-expect-error
					fs.promises.access.mock.calls.slice(-13),
				).toEqual([
					['/package.json'],
					['/.non-existentrc.json'],
					['/.non-existentrc.js'],
					['/.non-existentrc.cjs'],
					['/.non-existentrc.mjs'],
					['/.config/non-existentrc'],
					['/.config/non-existentrc.json'],
					['/.config/non-existentrc.js'],
					['/.config/non-existentrc.cjs'],
					['/.config/non-existentrc.mjs'],
					['/non-existent.config.js'],
					['/non-existent.config.cjs'],
					['/non-existent.config.mjs'],
				]);
				const ccResult = await cosmiconfig('non-existent', options).search();

				const expected = null;

				expect(result).toEqual(expected);
				expect(ccResult).toEqual(expected);
			});
		}

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

			const result = await lilconfig('maybeEmpty', options).search(searchFrom);
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

			const result = await lilconfig('maybeEmpty', options).search(searchFrom);
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
					'.js': () => {
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
			const relativeFilepath = filepath.slice(process.cwd().length + 1);

			const errMsg = `ENOENT: no such file or directory, open '${filepath}'`;

			expect(lilconfig('test-app').load(relativeFilepath)).rejects.toThrowError(
				errMsg,
			);

			expect(
				cosmiconfig('test-app').load(relativeFilepath),
			).rejects.toThrowError(errMsg);
		});

		it('throws for invalid json', async () => {
			const dirname = path.join(__dirname, 'load');
			const filepath = path.join(dirname, 'test-invalid.json');
			const relativeFilepath = filepath.slice(process.cwd().length + 1);

			/**
			 * throws but less elegant
			 */
			expect(lilconfig('test-app').load(relativeFilepath)).rejects.toThrowError(
				isNodeV20orNewer
					? `Expected ',' or '}' after property value in JSON at position 22`
					: 'Unexpected token / in JSON at position 22',
			);

			expect(
				cosmiconfig('test-app').load(relativeFilepath),
			).rejects.toThrowError(`JSON Error in ${filepath}:`);
		});

		it('throws for provided filepath that does not exist', async () => {
			const dirname = path.join(__dirname, 'load');
			const filepath = path.join(dirname, 'i-do-no-exist.js');
			const relativeFilepath = filepath.slice(process.cwd().length + 1);
			const errMsg = `ENOENT: no such file or directory, open '${filepath}'`;

			expect(
				lilconfig('test-app', {}).load(relativeFilepath),
			).rejects.toThrowError(errMsg);
			expect(
				cosmiconfig('test-app', {}).load(relativeFilepath),
			).rejects.toThrowError(errMsg);
		});

		it('no loader specified for the search place', async () => {
			const filepath = path.join(__dirname, 'load', 'config.coffee');
			const relativeFilepath = filepath.slice(process.cwd().length + 1);

			const errMsg = 'No loader specified for extension ".coffee"';

			expect(lilconfig('test-app').load(relativeFilepath)).rejects.toThrowError(
				errMsg,
			);
			expect(
				cosmiconfig('test-app').load(relativeFilepath),
			).rejects.toThrowError(errMsg);
		});

		it('loader is not a function', async () => {
			const filepath = path.join(__dirname, 'load', 'config.coffee');
			const relativeFilepath = filepath.slice(process.cwd().length + 1);
			const options = {
				loaders: {
					'.coffee': true,
				},
			};

			const errMsg = 'loader is not a function';

			expect(
				lilconfig(
					'test-app',
					// @ts-expect-error: for unit test purpose
					options,
				).load(relativeFilepath),
			).rejects.toThrowError(errMsg);
			expect(
				// @ts-ignore: required for jest, but not ts used in editor
				cosmiconfig('test-app', options).load(relativeFilepath),
			).rejects.toThrowError(errMsg);
		});

		it('no extension loader throws for unparsable file', async () => {
			const filepath = path.join(__dirname, 'load', 'test-noExt-nonParsable');
			const relativeFilepath = filepath.slice(process.cwd().length + 1);

			await expect(
				lilconfig('test-app').load(relativeFilepath),
			).rejects.toThrowError(
				isNodeV20orNewer
					? `Unexpected token 'h', "hobbies:\n- \"Reading\n" is not valid JSON`
					: 'Unexpected token h in JSON at position 0',
			);
			await expect(
				cosmiconfig('test-app').load(relativeFilepath),
			).rejects.toThrowError(`YAML Error in ${filepath}`);
		});

		it('throws for empty strings passed to load', async () => {
			const errMsg = 'load must pass a non-empty string';

			expect(lilconfig('test-app').load('')).rejects.toThrowError(errMsg);
			expect(cosmiconfig('test-app').load('')).rejects.toThrowError(
				'EISDIR: illegal operation on a directory, read',
			);
		});

		it('throws when provided searchPlace has no loader', () => {
			const errMsg = 'Missing loader for extension "file.coffee"';
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
				'Loader for extension "file.js" is not a function: Received object';
			const options = {
				searchPlaces: ['file.js'],
				loaders: {
					'.js': {},
				},
			};
			expect(() =>
				lilconfig(
					'foo',
					// @ts-expect-error: for unit test purpose
					options,
				),
			).toThrowError(errMsg);
			expect(() =>
				cosmiconfig(
					'foo',
					// @ts-ignore: needed for jest
					options,
				),
			).toThrowError(errMsg);
		});

		it('throws for searchPlaces with no extension', () => {
			const errMsg =
				'Loader for extension "file" is not a function: Received object.';
			const options = {
				searchPlaces: ['file'],
				loaders: {
					noExt: {},
				},
			};
			expect(() => {
				lilconfig(
					'foo',
					// @ts-expect-error: for unit test purpose
					options,
				);
			}).toThrowError(errMsg);
			expect(() => {
				cosmiconfig(
					'foo',
					// @ts-ignore: needed for jest, but not editor
					options,
				);
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

		expect(typeof lc.defaultLoaders).toEqual(typeof cc.defaultLoaders);
		expect(typeof lc.defaultLoadersSync).toEqual(typeof cc.defaultLoadersSync);
		// @ts-expect-error: not in types
		expect(typeof lc.defaultLoadersAsync).toEqual(
			// @ts-expect-error: not in types
			typeof cc.defaultLoadersAsync,
		);

		const lcExplorerSyncKeys = Object.keys(lc.lilconfigSync('foo'));
		const ccExplorerSyncKeys = Object.keys(cc.cosmiconfigSync('foo'));

		expect(lcExplorerSyncKeys).toEqual(ccExplorerSyncKeys);

		/* eslint-disable @typescript-eslint/no-unused-vars */
		const omitKnownDifferKeys = ({
			lilconfig,
			lilconfigSync,
			cosmiconfig,
			cosmiconfigSync,
			metaSearchPlaces,
			...rest
		}) => rest;
		/* eslint-enable @typescript-eslint/no-unused-vars */

		// @ts-expect-error: not in types
		expect(Object.keys(omitKnownDifferKeys(lc)).sort()).toEqual(
			// @ts-expect-error: not in types
			Object.keys(omitKnownDifferKeys(cc)).sort(),
		);
	});
});
