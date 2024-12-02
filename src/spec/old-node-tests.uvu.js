const uvu = require('uvu');
const assert = require('assert');
const path = require('path');
const {lilconfig, lilconfigSync, defaultLoaders} = require('..');
const {cosmiconfig, cosmiconfigSync} = require('cosmiconfig');
const {transpileModule} = require('typescript');

const dirname = path.join(__dirname, 'load');
/** @type {import('../index').LoaderSync} */
const tsLoader = (_, content) => {
	const res = transpileModule(content, {}).outputText;
	// biome-ignore lint: it is a test
	return eval(res);
};

const tsLoaderSuit = uvu.suite('ts-loader');

tsLoaderSuit('sync', () => {
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
	const result = lilconfigSync('test-app', options).load(relativeFilepath);
	const ccResult = cosmiconfigSync('test-app', options).load(relativeFilepath);

	assert.deepStrictEqual(result, expected);
	assert.deepStrictEqual(ccResult, expected);
});

tsLoaderSuit('async', async () => {
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
	const result = await lilconfig('test-app', options).load(relativeFilepath);
	const ccResult = await cosmiconfig('test-app', options).load(
		relativeFilepath,
	);

	assert.deepStrictEqual(result, expected);
	assert.deepStrictEqual(ccResult, expected);
});

tsLoaderSuit.run();

const esmProjectSuit = uvu.suite('esm-project');
esmProjectSuit('async search js', async () => {
	const stopDir = __dirname;
	const filepath = path.join(stopDir, 'esm-project', 'esm.config.js');
	const searchFrom = path.join(stopDir, 'esm-project', 'a', 'b', 'c');

	const options = {
		searchPlaces: ['esm.config.js'],
		stopDir,
	};

	const config = {esm: true};

	const result = await lilconfig('test-app', options).search(searchFrom);
	const ccResult = await cosmiconfig('test-app', options).search(searchFrom);

	assert.deepStrictEqual(result, {config, filepath});
	assert.deepStrictEqual(ccResult, {config, filepath});
});

esmProjectSuit('async search mjs', async () => {
	const stopDir = __dirname;
	const filepath = path.join(stopDir, 'esm-project', 'esm.config.mjs');
	const searchFrom = path.join(stopDir, 'esm-project', 'a', 'b', 'c');

	const options = {
		searchPlaces: ['esm.config.mjs'],
		stopDir,
	};

	const config = {esm: true};

	const result = await lilconfig('test-app', options).search(searchFrom);
	const ccResult = await cosmiconfig('test-app', options).search(searchFrom);

	assert.deepStrictEqual(result, {config, filepath});
	assert.deepStrictEqual(ccResult, {config, filepath});
});

esmProjectSuit('async search cjs', async () => {
	const stopDir = __dirname;
	const filepath = path.join(stopDir, 'esm-project', 'esm.config.cjs');
	const searchFrom = path.join(stopDir, 'esm-project', 'a', 'b', 'c');

	const options = {
		searchPlaces: ['esm.config.cjs'],
		stopDir,
	};

	const config = {cjs: true};

	const result = await lilconfig('test-app', options).search(searchFrom);
	const ccResult = await cosmiconfig('test-app', options).search(searchFrom);

	assert.deepStrictEqual(result, {config, filepath});
	assert.deepStrictEqual(ccResult, {config, filepath});
});

esmProjectSuit.run();

const cjsProjectSuit = uvu.suite('cjs-project');
cjsProjectSuit('async search js', async () => {
	const stopDir = __dirname;
	const filepath = path.join(stopDir, 'cjs-project', 'cjs.config.js');
	const searchFrom = path.join(stopDir, 'cjs-project', 'a', 'b', 'c');

	const options = {
		searchPlaces: ['cjs.config.js'],
		stopDir,
	};

	const config = {cjs: true};

	const result = await lilconfig('test-app', options).search(searchFrom);
	const ccResult = await cosmiconfig('test-app', options).search(searchFrom);

	assert.deepStrictEqual(result, {config, filepath});
	assert.deepStrictEqual(ccResult, {config, filepath});
});

cjsProjectSuit('async search mjs', async () => {
	const stopDir = __dirname;
	const filepath = path.join(stopDir, 'cjs-project', 'cjs.config.mjs');
	const searchFrom = path.join(stopDir, 'cjs-project', 'a', 'b', 'c');

	const options = {
		searchPlaces: ['cjs.config.mjs'],
		stopDir,
	};

	const config = {esm: true};

	const result = await lilconfig('test-app', options).search(searchFrom);
	const ccResult = await cosmiconfig('test-app', options).search(searchFrom);

	assert.deepStrictEqual(result, {config, filepath});
	assert.deepStrictEqual(ccResult, {config, filepath});
});

cjsProjectSuit('async search cjs', async () => {
	const stopDir = __dirname;
	const filepath = path.join(stopDir, 'cjs-project', 'cjs.config.cjs');
	const searchFrom = path.join(stopDir, 'cjs-project', 'a', 'b', 'c');

	const options = {
		searchPlaces: ['cjs.config.cjs'],
		stopDir,
	};

	const config = {cjs: true};

	const result = await lilconfig('test-app', options).search(searchFrom);
	const ccResult = await cosmiconfig('test-app', options).search(searchFrom);

	assert.deepStrictEqual(result, {config, filepath});
	assert.deepStrictEqual(ccResult, {config, filepath});
});

cjsProjectSuit.run();

const defaultLoaderSuit = uvu.suite('js-default-loader');

defaultLoaderSuit('loads js file', async () => {
	const filepath = path.join(__dirname, 'load', 'test-app.js');
	const result = await defaultLoaders['.js'](filepath, '');

	assert.deepStrictEqual(result, {jsTest: true});
});

defaultLoaderSuit('loads cjs file', async () => {
	const filepath = path.join(__dirname, 'load', 'test-app.cjs');
	const result = await defaultLoaders['.cjs'](filepath, '');

	assert.deepStrictEqual(result, {jsTest: true});
});

defaultLoaderSuit('loads mjs file', async () => {
	const filepath = path.join(__dirname, 'load', 'test-app.mjs');
	const result = await defaultLoaders['.mjs'](filepath, '');

	assert.deepStrictEqual(result, {jsTest: true});
});

defaultLoaderSuit.run();
