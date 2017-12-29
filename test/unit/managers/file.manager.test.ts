import { suite, test } from 'mocha-typescript';
import * as unit from 'unit.js';
import { Observable } from 'rxjs';

import { FilesManager } from '../../../src/module/managers/files.manager';
import { BucketManager } from '../../../src/module/managers/bucket.manager';
import { MinioServiceMock } from '../../mocks/index';
import { Readable } from 'stream';

@suite('- Unit Test FilesManager')
export class FilesManagerUnitTest {

    private _bucketManager: BucketManager;
    private _filesManager: FilesManager;
    private _modelMock: any;

    before() {
        this._modelMock = {
            findOneAndUpdate: unit.stub().returns(Promise.resolve()),
            find: unit.stub().returns(Promise.resolve()),
            findOne: unit.stub().returns(Promise.resolve()),
            update: unit.stub().returns(Promise.resolve()),
            findOneAndRemove: unit.stub().returns(Promise.resolve()),
        };
        const mongoMock = {
            getModel: () => this._modelMock
        };
        this._bucketManager = new BucketManager(<any>MinioServiceMock);
        this._filesManager = new FilesManager(this._bucketManager, <any>mongoMock);
    }

    after() {
        this._modelMock = undefined;
        this._bucketManager = undefined;
        this._filesManager = undefined;
    }

    @test('- _getDocument')
    getDocument() {
        unit.function(this._filesManager['_getDocument']);
        unit.object(this._filesManager['_getDocument']()).is(this._modelMock);
    }

    @test('- exists: yes')
    existsYes(done) {
        const filename = 'helloworld.txt';
        unit.function(this._filesManager.exists);
        unit.stub(this._bucketManager, 'fileStat').returns(Observable.of({}));
        unit.stub(this._filesManager, 'findByFilename').returns(Observable.of({ filename }));
        const obs = this._filesManager.exists(filename);
        obs.subscribe(_ => {
            unit.bool(_).isTrue();
            done();
        }, err => done(err));
    }

    @test('- exists: no')
    existsNo(done) {
        const filename = 'helloworld.txt';
        unit.function(this._filesManager.exists);
        unit.stub(this._bucketManager, 'fileStat').returns(Observable.of({}));
        unit.stub(this._filesManager, 'findByFilename').returns(Observable.of(null));
        const obs = this._filesManager.exists(filename);
        obs.subscribe(_ => {
            unit.bool(_).isFalse();
            done();
        }, err => done(err));
    }

    @test('- exists: no 2')
    existsNo2(done) {
        const filename = 'helloworld.txt';
        unit.function(this._filesManager.exists);
        unit.stub(this._bucketManager, 'fileStat').returns(Observable.of(null));
        const obs = this._filesManager.exists(filename);
        obs.subscribe(_ => {
            unit.bool(_).isFalse();
            done();
        }, err => done(err));
    }

    @test('- Upload')
    upload(done) {
        const input = Buffer.from('helloworld');
        const filename = 'helloworld.txt';
        const content_type = 'text/plain';
        const metadata = { lupulus: { stock: 99, empty: 10 } };
        unit.stub(this._bucketManager, 'createFile').returns(Observable.of({
            size: input.length,
            contentType: content_type,
            etag: new Date().getTime(),
            lastModified: new Date(),
        }));
        const file = {
            filename,
            content_type,
            metadata,
            size: input.length,
            created_at: new Date(),
            updated_at: new Date(),
            md5: new Date().getTime(),
        };
        this._modelMock.findOneAndUpdate = unit.stub().returns(Promise.resolve({
            toJSON: () => file
        }));
        unit.function(this._filesManager.upload);
        const obs = this._filesManager.upload(input, filename, content_type, metadata);
        obs.subscribe(_ => {
            unit.object(_).is(file);
            done();
        }, err => done(err));
    }

    @test('- Create')
    create(done) {
        unit.function(this._filesManager.create);
        const input = Buffer.from('helloworld');
        const filename = 'helloworld.txt';
        const file = {
            filename,
            content_type: 'application/octet-stream',
            metadata: {},
            size: input.length,
            created_at: new Date(),
            updated_at: new Date(),
            md5: new Date().getTime(),
        };
        unit.stub(this._filesManager, 'exists').returns(Observable.of(false));
        unit.stub(this._filesManager, 'upload').returns(Observable.of(file));
        const obs = this._filesManager.create(input, filename);
        obs.subscribe(_ => {
            unit.object(_).is(file);
            done();
        }, err => done(err));
    }

    @test('- Create error: already exists')
    createAlreadyExists(done) {
        unit.function(this._filesManager.create);
        const input = Buffer.from('helloworld');
        const filename = 'helloworld.txt';
        unit.stub(this._filesManager, 'exists').returns(Observable.of(true));
        const obs = this._filesManager.create(input, filename);
        obs.subscribe(_ => done(new Error('Cannot be here')),
            err => {
                unit.object(err)
                    .isInstanceOf(Error)
                    .hasProperty('message', 'File helloworld.txt already exists');
                done();
            });
    }

    @test('- find')
    find(done) {
        const input = Buffer.from('helloworld');
        const filename = 'helloworld.txt';
        const file = {
            filename,
            content_type: 'application/octet-stream',
            metadata: {},
            size: input.length,
            created_at: new Date(),
            updated_at: new Date(),
            md5: new Date().getTime(),
        };
        this._modelMock.find.returns(Promise.resolve([file]));
        unit.function(this._filesManager.find);
        const obs = this._filesManager.find();
        obs.subscribe(_ => {
            unit.array(_).is([file]);
            done();
        }, err => done(err));
    }

    @test('- findByFilename')
    findByFilename(done) {
        const input = Buffer.from('helloworld');
        const filename = 'helloworld.txt';
        const file = {
            filename,
            content_type: 'application/octet-stream',
            metadata: {},
            size: input.length,
            created_at: new Date(),
            updated_at: new Date(),
            md5: new Date().getTime(),
        };
        this._modelMock.findOne.returns(Promise.resolve(file));
        unit.function(this._filesManager.findByFilename);
        const obs = this._filesManager.findByFilename(filename);
        obs.subscribe(_ => {
            unit.object(_).is(file);
            done();
        }, err => done(err));
    }

    @test('- download')
    download(done) {
        const readStream = new Readable();
        readStream.push('helloworld');
        readStream.push(null);
        unit.stub(this._bucketManager, 'getAdapter').returns({
            getObject: () => Observable.of(readStream)
        });
        const filename = 'helloworld.txt';
        unit.stub(this._filesManager, 'findByFilename').returns(Observable.of({ filename }));
        const obs = this._filesManager.download(filename);
        obs.subscribe(_ => {
            unit.object(_).isInstanceOf(Readable);
            done();
        }, err => done(err));
    }

}
