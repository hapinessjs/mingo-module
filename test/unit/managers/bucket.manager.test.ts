import { suite, test } from 'mocha-typescript';
import * as unit from 'unit.js';
import { Observable } from 'rxjs';

import { BucketManager } from '../../../src/module/managers/bucket.manager';
import { MinioBucketRegion } from '@hapiness/minio';

@suite('- Unit Test BucketManager')
export class BucketManagerUnitTest {

    private _bucketManager: BucketManager;
    private _minioService;

    before() {
        this._minioService = <any>{
            bucketExists: unit.stub().returns(Observable.of(false)),
            makeBucket: unit.stub().returns(Observable.of(true)),
            putObject: unit.stub().returns(Observable.of('')),
            statObject: unit.stub().returns(Observable.of({ size: 4654 })),
            removeObject: unit.stub().returns(Observable.of(''))
        };
        this._bucketManager = new BucketManager(this._minioService);
    }

    after() {
        this._minioService = undefined;
        this._bucketManager = undefined;
    }

    @test('- set and get name/region')
    setNameAndRegion() {
        unit.function(this._bucketManager.setName);
        unit.function(this._bucketManager.getName);
        unit.function(this._bucketManager.setRegion);
        unit.function(this._bucketManager.getRegion);

        unit.object(this._bucketManager.setName('ananas')).isInstanceOf(BucketManager);
        unit.string(this._bucketManager.getName()).is('ananas');

        unit.object(this._bucketManager.setRegion(MinioBucketRegion.EU_CENTRAL_1)).isInstanceOf(BucketManager);
        unit.string(this._bucketManager.getRegion()).is(MinioBucketRegion.EU_CENTRAL_1);
    }

    @test('- get adapter')
    getAdapter() {
        unit.function(this._bucketManager.getAdapter);
        unit.object(this._bucketManager.getAdapter()).is(this._minioService);
    }

    @test('- Assert')
    assert(done) {
        unit.function(this._bucketManager.assert);
        const obs = this._bucketManager.assert();
        obs.subscribe(_ => done(), err => done(err));
    }

    @test('- Remove object')
    removeObject(done) {
        unit.function(this._bucketManager.removeFile);
        const obs = this._bucketManager.removeFile('xopxop');
        obs.subscribe(_ => done(), err => done(err));
    }

    @test('- Create file')
    createFile(done) {
        unit.function(this._bucketManager.createFile);
        const obs = this._bucketManager.createFile('file content', 'sample.txt', undefined, 'text/plain');
        obs.subscribe(_ => done(), err => done(err));
    }

    @test('- File stat')
    fileStat(done) {
        unit.function(this._bucketManager.fileStat);
        const obs = this._bucketManager.fileStat('sample.txt');
        obs.subscribe(_ => done(), err => done(err));
    }
}
