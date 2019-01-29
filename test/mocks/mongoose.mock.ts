import * as unit from 'unit.js';
import * as mongoose from 'mongoose';

import { EventEmitter } from 'events';

export class ConnectionMock extends EventEmitter {
    private _db: any;
    private then: any;
    private catch: any;

    constructor() {
        super();
        this.then = this.then;
        this.catch = this.catch;
    }

    emitAfter(evt: string, delay?: number, objectToSend?: any) {
        setTimeout(() => {
            if (!!objectToSend) {
                this.emit(evt, objectToSend);
            } else {
                this.emit(evt);
            }
        }, delay || 200);
    }

    get db(): any {
        return this._db;
    }

    set db(theDb: any) {
        this._db = theDb;
    }

    get client(): any {
        return {
            close: () => Promise.resolve()
        }
    }

    model(collection: string, schema: any) {
        return schema;
    }

    openUri(fail?: boolean, error?: Error) {
        const promise =  new Promise((resolve, reject) => {
            if (fail) {
                return reject(error);
            }

            resolve();
        });

        this.then = function(resolve, reject) {
            return promise.then(resolve, reject);
        };

        this.catch = function(reject) {
            return promise.catch(reject);
        };

        return this;
    }
}

export class MongooseMock {
    private _mocks;

    constructor() {
        this._mocks = [];
    }

    mockCreateConnection() {
        const mockConnection = new ConnectionMock().openUri();

        const mock = unit
            .stub(mongoose, 'createConnection')
            .returns(mockConnection);

        this._mocks = this._mocks.concat(mock);

        return mockConnection;
    }

    restore() {
        this._mocks.forEach(_mock => _mock.restore());
        this._mocks = [];
    }
}

export const MongooseMockInstance = new MongooseMock();
