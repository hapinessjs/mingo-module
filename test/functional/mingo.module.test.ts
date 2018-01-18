/**
 * @see https://github.com/pana-cc/mocha-typescript
 */
import { test, suite } from 'mocha-typescript';

/**
 * @see http://unitjs.com/
 */
import * as unit from 'unit.js';
import * as fs from 'fs';
import * as crypto from 'crypto';

import { Hapiness, HapinessModule, OnStart } from '@hapiness/core';
import { MongoModule, MongoClientExt } from '@hapiness/mongo';
import { MinioModule, MinioExt } from '@hapiness/minio';

import { MingoModule, MingoService } from '../../src';
import { FilesManager } from '../../src/module/managers/files.manager';


@suite('- MingoModule functional test file')
export class MingoModuleFunctionalTest {
    @test('Mingo module load successfuly and run several commands')
    mingoRunSuccess(done) {
        const fileProperties = [
            { filename: 'package.json' },
            { content_type: 'json' },
            { size: fs.lstatSync('./package.json').size },
            { md5: crypto.createHash('md5').update(fs.readFileSync('./package.json', { encoding: 'utf8'})).digest('hex') }
        ];

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
        class ApplicationModule implements OnStart {
            constructor(private _mingoService: MingoService) { }

            onStart() {
                const self = this;
                function fb(): FilesManager {
                    return self._mingoService.fromBucket('test.bucket');
                }

                fb().create(fs.createReadStream('./package.json'), 'package.json', 'json', null)
                    .do(_ => unit
                        .object(_)
                        .contains(...fileProperties)
                    )
                    .flatMap(_ => fb().exists('package.json'))
                    .do(_ => unit.bool(_).isTrue())
                    .flatMap(_ => fb().findByFilename('package.json'))
                    .do(_ => unit
                        .object(_)
                        .contains(...fileProperties)
                    )
                    .flatMap(_ => fb().updateByFilename('package.json', { meta1: 'metadata' }))
                    .do(_ => unit
                        .object(_)
                        .contains(...fileProperties)
                        .contains({ metadata: { meta1 : 'metadata' } })
                    )
                    .flatMap(_ => fb().exists('package.json'))
                    .do(_ => unit
                        .bool(_)
                        .isTrue()
                    )
                    .flatMap(_ => fb().removeByFilename('package.json'))
                    .do(_ => unit.object(_))
                    .flatMap(_ => fb().exists('package.json'))
                    .do(_ => unit.bool(_).isFalse())
                    .subscribe(_ => done(),
                        err => done(err)
                    );
            }
        }

        Hapiness.bootstrap(ApplicationModule, [
            MongoClientExt.setConfig({
                load: [
                    {
                        name: 'mongoose',
                        config: {
                            url: 'mongodb://localhost:27017'
                        }
                    },
                    {
                        name: 'mongoose-gridfs',
                        config: {
                            url: 'mongodb://localhost:27017',
                            connectionName: 'nope'
                        }
                    }
                ]
            }),
            MinioExt.setConfig({
                connection: {
                    endPoint: '172.18.0.2',
                    port: 9000,
                    secure: false,
                    accessKey: 'AKIAIOSFODNN7EXAMPLE',
                    secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
                },
                default_region: 'us-east-1'
            })
        ])
        .catch(err => {
            done(err);
        });
    }
}
