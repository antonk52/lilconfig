import Benchmark = require('benchmark');
import {lilconfigSync, lilconfig} from './index';
import {lilconfigSync as oldSync, lilconfig as old} from './old';

const searcherSyncOld = oldSync('prettier');
const searcherSyncNew = lilconfigSync('prettier');
const searcherAsyncOld = old('prettier');
const searcherAsyncNew = lilconfig('prettier');

async function runSuite(
    name: string,
    oldFn: () => any,
    newFn: () => any,
): Promise<void> {
    console.log(`Running "${name}"`);
    const suite = new Benchmark.Suite(name);
    return new Promise(res =>
        suite
            .add('old', oldFn)
            .add('new', newFn)
            .on('cycle', function (event: any) {
                console.log(String(event.target));
            })
            .on('complete', function (this: any) {
                console.log('Fastest is ' + this.filter('fastest').map('name'));
                console.log('');
                res();
            })
            .run({async: true, minSamples: 100}),
    );
}

(async () => {
    await runSuite(
        'sync single run',
        () => {
            searcherSyncOld.search();
        },
        () => {
            searcherSyncNew.search();
        },
    );

    await runSuite(
        'sync double run',
        () => {
            searcherSyncOld.search();
            searcherSyncOld.search();
        },
        () => {
            searcherSyncNew.search();
            searcherSyncNew.search();
        },
    );

    await runSuite(
        'async single run',
        async () => {
            await searcherAsyncOld.search();
        },
        async () => {
            await searcherAsyncNew.search();
        },
    );

    await runSuite(
        'async double run',
        async () => {
            await searcherAsyncOld.search();
            await searcherAsyncOld.search();
        },
        async () => {
            await searcherAsyncNew.search();
            await searcherAsyncNew.search();
        },
    );
})();
