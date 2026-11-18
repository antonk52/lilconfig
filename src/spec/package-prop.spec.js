// @ts-check
const fs = require('fs');
const os = require('os');
const path = require('path');
const {lilconfig, lilconfigSync} = require('..');
const {cosmiconfig, cosmiconfigSync} = require('cosmiconfig');

let dirname;
let child;
beforeEach(() => {
	dirname = fs.mkdtempSync(path.join(os.tmpdir(), 'lilconfig-package-prop-'));
	child = path.join(dirname, 'child');
	fs.mkdirSync(child);
});
afterEach(() => fs.rmSync(dirname, {recursive: true, force: true}));

describe.each([
	['sync', lilconfigSync, cosmiconfigSync],
	['async', lilconfig, cosmiconfig],
])('%s package properties', (_, create, createComparison) => {
	for (const config of [false, 0, '']) {
		it.each([
			['default', {}, {app: config}, {app: {parent: true}}],
			['string', {packageProp: 'app'}, {app: config}, {app: {parent: true}}],
			['array', {packageProp: ['app']}, {app: config}, {app: {parent: true}}],
			[
				'nested string',
				{packageProp: 'tools.app'},
				{tools: {app: config}},
				{tools: {app: {parent: true}}},
			],
			[
				'nested array',
				{packageProp: ['tools', 'app']},
				{tools: {app: config}},
				{tools: {app: {parent: true}}},
			],
		])(
			`preserves ${JSON.stringify(config)} using %s`,
			async (_, option, pkg, parent) => {
				const filepath = path.join(child, 'package.json');
				fs.writeFileSync(filepath, JSON.stringify(pkg));
				fs.writeFileSync(
					path.join(dirname, 'package.json'),
					JSON.stringify(parent),
				);
				const options = {
					stopDir: dirname,
					searchPlaces: ['package.json'],
					...option,
				};
				const expected = {config, filepath};
				const explorer = create('app', options);
				const comparison = createComparison('app', options);
				expect(await explorer.load(filepath)).toEqual(expected);
				expect(await explorer.search(child)).toEqual(expected);
				expect(await comparison.load(filepath)).toEqual(expected);
				expect(await comparison.search(child)).toEqual(expected);
			},
		);
	}

	it.each([{}, {app: null}])(
		'keeps falling back for an absent property in %p',
		async pkg => {
			fs.writeFileSync(path.join(child, 'package.json'), JSON.stringify(pkg));
			const filepath = path.join(dirname, 'package.json');
			fs.writeFileSync(filepath, JSON.stringify({app: {parent: true}}));
			const explorer = create('app', {
				stopDir: dirname,
				searchPlaces: ['package.json'],
			});
			expect(await explorer.search(child)).toEqual({
				config: {parent: true},
				filepath,
			});
		},
	);
});
