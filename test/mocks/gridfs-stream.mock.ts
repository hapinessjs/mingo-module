import * as unit from 'unit.js';
import { MongooseGridFsAdapter } from '@hapiness/mongo';

export class GridFsMock {
    private _mocks;

    constructor() {
        this._mocks = [];
    }

    mockGridFsStream() {
        const mock = unit
        .stub(MongooseGridFsAdapter.prototype, '_createGridFsStream')
        .returns(42);

        this._mocks = this._mocks.concat(mock);

        return mock;
    }

    restore() {
        this._mocks.forEach(_mock => _mock.restore());
        this._mocks = [];
    }
}

export const GridFsMockInstance = new GridFsMock();
