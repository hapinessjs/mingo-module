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
import { Biim } from '@hapiness/biim';
import { Observable } from 'rxjs/Observable';

@suite('- MingoModule functional test file')
export class MingoModuleFunctionalTest {
    @test('Mingo module load successfuly and run several commands')
    mingoRunSuccess(done) {
        const fileProperties = {
            id: null,
            filename: 'package.json',
            contentType: 'application/json',
            size: fs.lstatSync('./package.json').size,
            md5: crypto.createHash('md5').update(fs.readFileSync('./package.json', { encoding: 'utf8'})).digest('hex'),
            created_at: null,
            updated_at: null
        };

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

                fb().create(fs.createReadStream('./package.json'), 'package.json', 'application/json', null)
                    .do(_ => Object.assign(fileProperties, { id: _.id, created_at: _.created_at, updated_at: _.updated_at }))
                    .do(_ => unit
                        .object(_)
                        .is(fileProperties)
                    )
                    .flatMap(_ => fb().exists('package.json'))
                    .do(_ => unit.bool(_).isTrue())
                    .flatMap(_ => fb().findByFilename('package.json'))
                    .do(_ => unit
                        .object(_)
                        .is(fileProperties)
                    )
                    .do(_ => unit
                        .object(_)
                        .is(fileProperties)
                    )
                    .flatMap(_ => fb().updateByFilename('package.json', { meta1: 'metadata' }))
                    .do(_ => unit
                        .object(_)
                        .is(Object.assign({}, fileProperties, { metadata: { meta1 : 'metadata' } }))
                    )
                    .flatMap(_ => fb().exists('package.json'))
                    .do(_ => unit
                        .bool(_)
                        .isTrue()
                    )
                    .flatMap(_ => fb().update({ contentType: 'application/json' }, { meta2: 'json' }))
                    .do(_ => unit
                        .array(_)
                        .contains([{ metadata: { meta1 : 'metadata',  meta2: 'json' } }])
                    )
                    .flatMap(_ => fb().exists(null))
                    .catch(_ => {
                        unit.object(_).isInstanceOf(Error).is(Biim.badRequest(`No filename provided`));
                        return Observable.of(null);
                    })
                    .flatMap(_ => fb().removeByFilename(null))
                    .catch(_ => {
                        unit.object(_).isInstanceOf(Error).is(Biim.badRequest(`No filename provided`));
                        return Observable.of(null);
                    })
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
                            url: 'mongodb://localhost:27017/mingo-tests'
                        }
                    },
                    {
                        name: 'mongoose-gridfs-bucket',
                        config: {
                            url: 'mongodb://localhost:27017/mingo-tests',
                            connectionName: 'nope'
                        }
                    }
                ]
            }),
            MinioExt.setConfig({
                connection: {
                    endPoint: 'florent.in.tdw',
                    port: 9000,
                    useSSL: false,
                    accessKey: 'AKIAIOSFODNN7EXAMPLE',
                    secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
                }
            })
        ])
        .catch(err => {
            done(err);
        });
    }
}
