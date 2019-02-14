import { suite, test } from 'mocha-typescript';
import * as unit from 'unit.js';
import { Observable } from 'rxjs';

import { FilesManager } from '../../../src/module/managers/files.manager';
import { BucketManager } from '../../../src/module/managers/bucket.manager';
import { MinioServiceMock } from '../../mocks';
import { Readable } from 'stream';
import { MingoConfig } from '../../../src';
import { FilesRepository } from '../../../src/module/repository';

@suite('- Unit Test FilesManager')
export class FilesRepositoryUnitTest {

    private _modelMock: any;
    private _mongoMock: any;
    private _filesRepository: any;
    private _configMock: MingoConfig = {};

    private _classMock = {
        toJSON: function () {
            return this;
        }
    }

    before() {
        this._modelMock = {
            findOneAndUpdate: unit.stub().returns(Promise.resolve()),
            find: unit.stub().returns(Promise.resolve()),
            findOne: unit.stub().returns(Promise.resolve()),
            update: unit.stub().returns(Promise.resolve()),
            findOneAndRemove: unit.stub().returns(Promise.resolve()),
        };
        this._mongoMock = {
            getModel: () => this._modelMock
        };

        this._filesRepository = new FilesRepository(this._mongoMock, this._configMock);
    }

    after() {
        this._modelMock = undefined;
        this._filesRepository = undefined;
        this._configMock = {};
    }

    @test('- _getDocument')
    getDocument() {
        unit.function(this._filesRepository['_getDocument']);
        unit.object(this._filesRepository['_getDocument']()).is(this._modelMock);
    }


    @test('- _getDocument: retreive options\' connectionName')
    getDocumentWithOptions(done) {
        const connectionName = { connectionName: 'test' };
        this._configMock = { db: connectionName };
        const getModelSpy = unit.spy(this._mongoMock, 'getModel');
        this._filesRepository = new FilesRepository(this._mongoMock, this._configMock);

        this._filesRepository['_getDocument']();
        unit.string(JSON.stringify(getModelSpy.getCalls()[0].args[0]))
            .isEqualTo(JSON.stringify(Object.assign({ adapter: 'mongoose'}, { options: connectionName })));
        done();
    }

    @test('- _prepareUpdateObject')
    _prepareUpdateObject() {
        const input = {
            meta1: '',
            meta2: 2,
            meta3: {},
            meta4: ['a', 'b', 'c']
        };

        const output = {
            'metadata.meta4': ['a', 'b', 'c'],
            'metadata.meta3': {},
            'metadata.meta2': 2,
            'metadata.meta1': ''
        };

        const res = this._filesRepository['_prepareUpdateObject'](input);
        unit.string(JSON.stringify(res)).isEqualTo(JSON.stringify(output));
    }
}
