import Benchmark = require('benchmark');
import {lilconfigSync, lilconfig} from './index';
import {lilconfigSync as oldSync, lilconfig as old} from './old';

const searcherSyncOld = oldSync('prettier');
const searcherSyncNew = lilconfigSync('prettier');
const searcherAsyncOld = old('prettier');
const searcherAsyncNew = lilconfig('prettier');

type Fn = import('benchmark').Options;
async function runSuite(name: string, oldFn: Fn, newFn: Fn): Promise<void> {
    console.log(`Running "${name}"`);
    const suite = new Benchmark.Suite(name, {});

    return new Promise(res =>
        suite
            .add(oldFn)
            .add(newFn)
            .on('cycle', function (event: any) {
                console.log(String(event.target));
            })
            .on('complete', function (this: any) {
                console.log('Fastest is ' + this.filter('fastest').map('name'));
                console.log('');
                res();
            })
            .run({async: false, minSamples: 100}),
    );
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
            fn: async () => {
                await searcherAsyncOld.search();
            },
        },
        {
            name: 'new',
            fn: async () => {
                await searcherAsyncNew.search();
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
            fn: async () => {
                await searcherAsyncOld.search();
                await searcherAsyncOld.search();
            },
        },
        {
            name: 'new',
            fn: async () => {
                await searcherAsyncNew.search();
                await searcherAsyncNew.search();
            },
            onCycle: () => {
                searcherAsyncNew.clearCaches();
            },
        },
    );
})();
