
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

@suite('- Integration MingoModule test file')
export class MingoModuleTest {

    @test('Mingo module fail to load because no minio manager have been set up')
    startUpFailWhenNoMinioManagerFound(done) {

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
                        name: 'mongoose',
                        config: {
                            url: 'mongodb://tdw01.dev01.in.tdw:27017/mingo_module_test',
                            connectionName: 'plop'
                        }
                    },
                    {
                        name: 'mongoose-gridfs',
                        config: {
                            url: 'mongodb://tdw01.dev01.in.tdw:27017/mingo_module_test',
                            connectionName: 'toto'
                        }
                    }
                ]
            })
        ])
        .catch(err => {
            unit.string(err).isEqualTo('@hapiness/minio needs to be set up for mingo to work.');
            return done();
        });
    }

    @test('Mingo module fail to load because no mongo manager have been configured')
    startUpFailWhenNoMongoManagerFound(done) {

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
            MinioExt.setConfig({
                connection: {
                    endPoint: 'endpoint.in.tdw',
                    port: 9000,
                    secure: false,
                    accessKey: 'accessKey',
                    secretKey: 'secretKey',
                },
                default_region: 'default'
            })
        ])
        .catch(err => {
            unit.string(err).isEqualTo('@hapiness/mongo needs to be set up & need a mongoose adapter for mingo to work.');
            return done();
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
                            url: 'mongodb://tdw01.dev01.in.tdw:27017/mingo_module_test'
                        }
                    }
                ],
                register: [ CustomAdapter ],
            }),
            MinioExt.setConfig({
                connection: {
                    endPoint: 'endpoint.in.tdw',
                    port: 9000,
                    secure: false,
                    accessKey: 'accessKey',
                    secretKey: 'secretKey',
                },
                default_region: 'default'
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
                        name: 'mongoose',
                        config: {
                            url: 'mongodb://tdw01.dev01.in.tdw:27017/mingo_module_test'
                        }
                    },
                    {
                        name: 'mongoose-gridfs',
                        config: {
                            url: 'mongodb://tdw01.dev01.in.tdw:27017/mingo_module_test'
                        }
                    }
                ]
            }),
            MinioExt.setConfig({
                connection: {
                    endPoint: 'endpoint.in.tdw',
                    port: 9000,
                    secure: false,
                    accessKey: 'accessKey',
                    secretKey: 'secretKey',
                },
                default_region: 'default'
            })
        ])
        .catch(err => {
            unit.string(err).isEqualTo('@hapiness/mongo needs to be set up & need a mongoose adapter for mingo to work.');
            return done();
        });
    }

    @test('Mingo module fail to load because Mingo module configuration is missing with multiple mongoose adapter.')
    startUpFailBecauseNoMingoModuleConfigurationWithMultipleMongooseAdapter(done) {

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
                        name: 'mongoose',
                        config: {
                            url: 'mongodb://tdw01.dev01.in.tdw:27017/mingo_module_test',
                            connectionName: 'mingo'
                        }
                    },
                    {
                        name: 'mongoose-gridfs',
                        config: {
                            url: 'mongodb://tdw01.dev01.in.tdw:27017/mingo_module_test',
                            connectionName: 'nope'
                        }
                    }
                ]
            }),
            MinioExt.setConfig({
                connection: {
                    endPoint: 'endpoint.in.tdw',
                    port: 9000,
                    secure: false,
                    accessKey: 'accessKey',
                    secretKey: 'secretKey',
                },
                default_region: 'default'
            })
        ])
        .catch(err => {
            unit.string(err).isEqualTo('@hapiness/mongo needs to be set up & need a mongoose adapter for mingo to work.');
            return done();
        });
    }

    @test('Mingo module load successfuly with multiple mongoose adapter have been configured with a conectionName')
    startUpSuccessWhenMultipleMongooseAdapterFoundWithConnectionName(done) {

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
                            url: 'mongodb://tdw01.dev01.in.tdw:27017/mingo_module_test',
                            connectionName: 'mingo'
                        }
                    },
                    {
                        name: 'mongoose-gridfs',
                        config: {
                            url: 'mongodb://tdw01.dev01.in.tdw:27017/mingo_module_test',
                            connectionName: 'nope'
                        }
                    }
                ]
            }),
            MinioExt.setConfig({
                connection: {
                    endPoint: 'endpoint.in.tdw',
                    port: 9000,
                    secure: false,
                    accessKey: 'accessKey',
                    secretKey: 'secretKey',
                },
                default_region: 'default'
            })
        ])
        .catch(err => {
            done(err);
        });
    }
}