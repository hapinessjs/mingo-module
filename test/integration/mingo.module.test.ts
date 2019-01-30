import * as mongoose from 'mongoose';
/**
 * @see https://github.com/pana-cc/mocha-typescript
 */
import { test, suite } from 'mocha-typescript';

/**
 * @see http://unitjs.com/
 */
import * as unit from 'unit.js';

import { Hapiness, HapinessModule, OnStart } from '@hapiness/core';
import { MongoModule, MongoClientExt, HapinessMongoAdapter } from '@hapiness/mongo';
import { MinioModule, MinioExt } from '@hapiness/minio';
import { MingoModule, MingoService } from '../../src';
import { Observable } from 'rxjs';
import { ConnectionMock, MongooseMockInstance, GridFsMockInstance } from '../mocks';

@suite('- Integration MingoModule test file')
export class MingoModuleTest {
    private _mockConnection: ConnectionMock;
    private _gridfsMock: any;

    before() {
        this._mockConnection = MongooseMockInstance.mockCreateConnection();
        this._gridfsMock = GridFsMockInstance.mockGridFsStream();
    }

    after() {
        MongooseMockInstance.restore();
        GridFsMockInstance.restore();

        this._mockConnection = undefined;
        this._gridfsMock = undefined;
        this._gridfsMock = this._gridfsMock; // remove warning
    }

    @test('Mingo module fail to load because no minio manager have been set up')
    startUpFailWhenNoMinioManagerFound(done) {
        this._mockConnection.emitAfter('connected', 400);
        this._mockConnection.db = new mongoose.mongo.Db('dbname', new mongoose.mongo.Server('fake.host.in.tdw', 4242));

        @HapinessModule({
            version: '1.0.0',
            declarations: [],
            imports: [
                MongoModule,
                MinioModule,
                MingoModule
            ],
            providers: [
                MingoService
            ],
            exports: []
        })
        class ApplicationModule { }

        Hapiness.bootstrap(ApplicationModule, [
            MongoClientExt.setConfig({
                load: [
                    {
                        name: 'mongoose',
                        config: {
                            url: 'mongodb://localhost:27017',
                            connectionName: 'minio'
                        }
                    },
                    {
                        name: 'mongoose-gridfs-bucket',
                        config: {
                            url: 'mongodb://localhost:27017',
                            connectionName: 'gridfs'
                        }
                    }
                ]
            })
        ])
        .then(() => done(new Error('Should not succeed')))
        .catch(err => {
            unit.string(err).isEqualTo('@hapiness/minio needs to be set up for mingo to work.');
            done();
        });
    }

    @test('Mingo module fail to load because no mongo manager have been configured')
    startUpFailWhenNoMongoManagerFound(done) {

        @HapinessModule({
            version: '1.0.0',
            declarations: [],
            imports: [
                MinioModule,
                MingoModule
            ],
            providers: [
                MingoService
            ],
            exports: []
        })
        class ApplicationModule {
        }

        Hapiness.bootstrap(ApplicationModule, [
            MinioExt.setConfig({
                connection: {
                    endPoint: 'endpoint.minio.tld',
                    port: 9000,
                    useSSL: false,
                    accessKey: 'accessKey',
                    secretKey: 'secretKey',
                },
            })
        ])
        .then(() => done(new Error('Should not succeed')))
        .catch(err => {
            unit.string(err).isEqualTo('@hapiness/mongo needs to be set up & need a mongoose adapter for mingo to work.');
            done();
        });
    }

    @test('Mingo module fail to load because no mongoose adapter have been configured')
    startUpFailWhenNoMongooseAdapterFound(done) {
        class CustomAdapter extends HapinessMongoAdapter {
            public static getInterfaceName(): string {
                return 'custom';
            }

            constructor(options) { super(options); }

            protected _tryConnect(): Observable<void> {
                return Observable.create(observer => { observer.next(); observer.complete(); })
            }

            protected _afterConnect(): Observable<void> {
                return this.onConnected();
            }

            public getLibrary(): any {
                return {
                    Schema: class {
                            constructor() {}
                            public set() {}
                        }
                    };
            }

            public registerValue(schema: any, collection: string, collectionName?: string): any {
                return {};
            }
        }

        @HapinessModule({
            version: '1.0.0',
            declarations: [],
            imports: [
                MongoModule,
                MinioModule,
                MingoModule
            ],
            providers: [
                MingoService
            ],
            exports: []
        })
        class ApplicationModule {
        }

        Hapiness.bootstrap(ApplicationModule, [
            MongoClientExt.setConfig({
                load: [
                    {
                        name: 'custom',
                        config: {
                            url: 'mongodb://localhost:27017'
                        }
                    }
                ],
                register: [ CustomAdapter ],
            }),
            MinioExt.setConfig({
                connection: {
                    endPoint: 'endpoint.minio.tld',
                    port: 9000,
                    useSSL: false,
                    accessKey: 'accessKey',
                    secretKey: 'secretKey',
                }
            })
        ])
        .then(() => done(new Error('Should not succeed')))
        .catch(err => {
            unit.string(err).isEqualTo('@hapiness/mongo needs to be set up & need a mongoose adapter for mingo to work.');
            return done();
        });
    }

    @test('Mingo module fail to load because multiple mongoose adapter have been configured without conectionName')
    startUpFailWhenMultipleMongooseAdapterFoundWithoutConnectionName(done) {
        this._mockConnection.emitAfter('connected', 400);
        this._mockConnection.db = new mongoose.mongo.Db('dbname', new mongoose.mongo.Server('fake.host.in.tdw', 4242));

        @HapinessModule({
            version: '1.0.0',
            declarations: [],
            imports: [
                MongoModule,
                MinioModule,
                MingoModule.setConfig({ db: { connectionName: 'mingo' } })
            ],
            providers: [
                MingoService
            ],
            exports: []
        })
        class ApplicationModule {
        }

        Hapiness.bootstrap(ApplicationModule, [
            MongoClientExt.setConfig({
                load: [
                    {
                        name: 'mongoose',
                        config: {
                            url: 'mongodb://localhost:27017',
                            db: 'db1'
                        }
                    },
                    {
                        name: 'mongoose',
                        config: {
                            url: 'mongodb://localhost:27017',
                            db: 'db2'
                        }
                    },
                    {
                        name: 'mongoose-gridfs-bucket',
                        config: {
                            url: 'mongodb://localhost:27017'
                        }
                    }
                ]
            }),
            MinioExt.setConfig({
                connection: {
                    endPoint: 'endpoint.minio.tld',
                    port: 9000,
                    useSSL: false,
                    accessKey: 'accessKey',
                    secretKey: 'secretKey',
                }
            })
        ])
        .catch(err => {
            unit.string(err).isEqualTo('@hapiness/mongo needs to be set up & need a mongoose adapter for mingo to work.');
            done();
        });
    }

    @test('Mingo module fail to load because Mingo module configuration is missing with multiple mongoose adapter.')
    startUpFailBecauseNoMingoModuleConfigurationWithMultipleMongooseAdapter(done) {
        this._mockConnection.emitAfter('connected', 400);
        this._mockConnection.db = new mongoose.mongo.Db('dbname', new mongoose.mongo.Server('fake.host.in.tdw', 4242));

        @HapinessModule({
            version: '1.0.0',
            declarations: [],
            imports: [
                MongoModule,
                MinioModule,
                MingoModule
            ],
            providers: [
                MingoService
            ],
            exports: []
        })
        class ApplicationModule { }

        Hapiness.bootstrap(ApplicationModule, [
            MongoClientExt.setConfig({
                load: [
                    {
                        name: 'mongoose',
                        config: {
                            url: 'mongodb://localhost:27017',
                            connectionName: 'mingo'
                        }
                    },
                    {
                        name: 'mongoose',
                        config: {
                            url: 'mongodb://localhost:27017',
                            connectionName: 'mongoose2'
                        }
                    },
                    {
                        name: 'mongoose-gridfs-bucket',
                        config: {
                            url: 'mongodb://localhost:27017',
                            connectionName: 'nope'
                        }
                    }
                ]
            }),
            MinioExt.setConfig({
                connection: {
                    endPoint: 'endpoint.minio.tld',
                    port: 9000,
                    useSSL: false,
                    accessKey: 'accessKey',
                    secretKey: 'secretKey',
                }
            })
        ])
        .catch(err => {
            unit.string(err).isEqualTo('@hapiness/mongo needs to be set up & need a mongoose adapter for mingo to work.');
            done();
        });
    }

    @test('Mingo module load successfuly with multiple mongoose adapter have been configured with a conectionName')
    startUpSuccessWhenMultipleMongooseAdapterFoundWithConnectionName(done) {
        this._mockConnection.emitAfter('connected', 400);
        this._mockConnection.db = new mongoose.mongo.Db('dbname', new mongoose.mongo.Server('fake.host.in.tdw', 4242));

        @HapinessModule({
            version: '1.0.0',
            declarations: [],
            imports: [
                MongoModule,
                MinioModule,
                MingoModule.setConfig({ db: { connectionName: 'mingo' }})
            ],
            providers: [
                MingoService
            ],
            exports: []
        })
        class ApplicationModule implements OnStart {
            onStart() {
                done();
            }
        }

        Hapiness.bootstrap(ApplicationModule, [
            MongoClientExt.setConfig({
                load: [
                    {
                        name: 'mongoose',
                        config: {
                            url: 'mongodb://localhost:27017',
                            connectionName: 'mingo'
                        }
                    },
                    {
                        name: 'mongoose-gridfs-bucket',
                        config: {
                            url: 'mongodb://localhost:27017',
                            connectionName: 'nope'
                        }
                    }
                ]
            }),
            MinioExt.setConfig({
                connection: {
                    endPoint: 'endpoint.minio.tld',
                    port: 9000,
                    useSSL: false,
                    accessKey: 'accessKey',
                    secretKey: 'secretKey',
                }
            })
        ])
        .catch(err => {
            done(err);
        });
    }
}
