import Benchmark = require('benchmark');
import {lilconfigSync, lilconfig} from './index';
import {lilconfigSync as oldSync, lilconfig as old} from './old';

const searcherSyncOld = oldSync('prettier');
const searcherSyncNew = lilconfigSync('prettier');
const searcherAsyncOld = old('prettier');
const searcherAsyncNew = lilconfig('prettier');

type Fn = import('benchmark').Options;
async function runSuite(name: string, ...fns: Fn[]): Promise<void> {
    console.log(`Running "${name}"`);
    const suite = new Benchmark.Suite(name, {});

    return new Promise(res => {
        suite
            .on('cycle', function (event: any) {
                console.log(String(event.target));
            })
            .on('complete', function (this: any) {
                console.log('Fastest is ' + this.filter('fastest').map('name'));
                console.log('');
                res();
            });

        fns.forEach(f => suite.add(f));
        suite.run({async: true, minSamples: 100});
    });
}

(async () => {
    const set = new Set(['existing']);
    await runSuite(
        'set',
        {
            name: 'always add   ',
            fn: () => {
                set.add('existing');
            },
        },
        {
            name: 'check and add',
            fn: () => {
                set.has('existing') || set.add('existing');
            },
        },
    );

    const map = new Map([]);
    const f = false;
    await runSuite(
        'clear caches',
        {
            name: 'with check',
            fn: () => {
                if (f) {
                    map.clear();
                }
            },
        },
        {
            name: 'call clear',
            fn: () => {
                map.clear();
            },
        },
    );

    const map2 = new Map([
        ['a', 1],
        ['b', 2],
        ['c', 3],
    ]);
    await runSuite(
        'check map and get',
        {
            name: 'check and get',
            fn: () => {
                if (map2.has('b')) {
                    const r = map2.get('b');
                }
            },
        },
        {
            name: 'get and check for undefined',
            fn: () => {
                const r = map2.get('b');
                if (r !== undefined) {
                    r;
                }
            },
        },
        {
            name: 'get and check for type undefined',
            fn: () => {
                const r = map.get('b');
                if (typeof r !== 'undefined') {
                    r;
                }
            },
        },
    );

    await runSuite(
        'sync single run',
        {
            name: 'old',
            fn: () => {
                searcherSyncOld.search();
            },
        },
        {
            name: 'new',
            fn: () => {
                searcherSyncNew.search();
            },
            onCycle: () => {
                searcherSyncNew.clearCaches();
            },
        },
    );

    await runSuite(
        'sync double run',
        {
            name: 'old',
            fn: () => {
                searcherSyncOld.search();
                searcherSyncOld.search();
            },
        },
        {
            name: 'new',
            fn: () => {
                searcherSyncNew.search();
                searcherSyncNew.search();
            },
            onCycle: () => {
                searcherSyncNew.clearCaches();
            },
        },
    );

    await runSuite(
        'async single run',
        {
            name: 'old',
            defer: true,
            fn: async (done: any) => {
                await searcherAsyncOld.search();
                done.resolve();
            },
        },
        {
            name: 'new',
            defer: true,
            fn: async (done: any) => {
                await searcherAsyncNew.search();
                done.resolve();
            },
            onCycle: () => {
                searcherAsyncNew.clearCaches();
            },
        },
    );

    await runSuite(
        'async double run',
        {
            name: 'old',
            defer: true,
            fn: async (done: any) => {
                await searcherAsyncOld.search();
                await searcherAsyncOld.search();
                done.resolve();
            },
        },
        {
            name: 'new',
            defer: true,
            fn: async (done: any) => {
                await searcherAsyncNew.search();
                await searcherAsyncNew.search();
                done.resolve();
            },
            onCycle: () => {
                searcherAsyncNew.clearCaches();
            },
        },
    );
})();
