import * as fs from 'fs';
import { HapinessModule, OnStart } from '@hapiness/core';
import { MinioModule } from '@hapiness/minio';
import { MongoModule } from '@hapiness/mongo';
import { MingoModule } from '../src/module/mingo.module';
import { MingoService } from '../src';
import { FilesManager } from '../src/module/managers/files.manager';
import { FilesRepository } from '../src/module/repository';

const debug = require('debug')('hapiness:mingo-module')

@HapinessModule({
    version: '1.0.0',
    declarations: [],
    imports: [
        MongoModule,
        MinioModule,
        MingoModule.setConfig({ db: { connectionName: 'mingo' } })
    ],
    providers: [
        MingoService,
        FilesRepository
    ],
    exports: []
})
export class ApplicationModule implements OnStart {

    constructor(private _mingoService: MingoService) { }

    onStart() {
        const self = this;
        function fb(): FilesManager {
            return self._mingoService.fromBucket('test.bucket');
        }

        fb().create(fs.createReadStream('./package.json'), 'package.json', 'json', null)
            .do(file => debug(`create _ ==> `, file))
            .flatMap(() => fb().exists('package.json'))
            .do(doesFileExists => debug(`exists after create _ ==> `, doesFileExists))
            .flatMap(() => fb().findByFilename('package.json'))
            .do(file => debug(`findByFilename _ ==> `, file))
            .flatMap(() => fb().updateByFilename('package.json', { meta1: 'metadata' }))
            .do(file => debug(`updateByFilename _ ==> `, file))
            .flatMap(() => fb().exists('package.json'))
            .do(doesFileExists => debug(`exists after update _ ==> `, doesFileExists))
            .flatMap(() => fb().download('package.json')
                .map(fileStream => fileStream.pipe(fs.createWriteStream('./package.result.zip')))
            )
            .do(() => debug(`downloaded!`))
            .flatMap(() => fb().removeByFilename('package.json'))
            .do(deletedFile => debug(`DONE! with result ${deletedFile}`))
            .subscribe(file => debug(`File was `, file),
                err => {
                    debug(`error : `, err)
                    debug(`stack : `, err.stack)
                    fb().removeByFilename('package.json')
                        .subscribe(removedFile => debug(`REMOVED ! ${removedFile}`),
                            error => debug(`error on remove : `, error),
                            () => debug(`done`));
                },
                () => process.exit(0)
            );
        }
}
