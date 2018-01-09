import * as fs from 'fs';
import { ReadStream } from 'fs-extra';
import { HapinessModule, OnStart } from '@hapiness/core';
import { MinioModule } from '@hapiness/minio';
import { MongoModule } from '@hapiness/mongo';
import { MingoModule } from '../src/module/mingo.module';
import { MingoService } from '../src/index';
import { FilesManager } from '../src/module/managers/files.manager';

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
        MingoService
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
            .do(_ => debug(`create _ ==> `, _))
            .flatMap(_ => fb().exists('package.json'))
            .do(_ => debug(`exists after create _ ==> `, _))
            .flatMap(_ => fb().findByFilename('package.json'))
            .do(_ => debug(`findByFilename _ ==> `, _))
            .flatMap(_ => fb().updateByFilename('package.json', { meta1: 'metadata' }))
            .do(_ => debug(`updateByFilename _ ==> `, _))
            .flatMap(_ => fb().exists('package.json'))
            .do(_ => debug(`exists after update _ ==> `, _))
            .flatMap(_ => fb().download('package.json')
                .map((__: any) => (__ as ReadStream).pipe(fs.createWriteStream('./package.result.zip')))
            )
            .do(_ => debug(`downloaded!`))
            .flatMap(_ => fb().removeByFilename('package.json'))
            .do(_ => debug(`DONE! with result ${_}`))
            .subscribe(_ => debug(`next = `, _),
                err => {
                    debug(`error : `, err)
                    debug(`stack : `, err.stack)
                    fb().removeByFilename('package.json')
                        .do(_ => debug(`REMOVED ! ${_}`))
                        .subscribe(_ => debug(`next = `, _),
                            error => debug(`error on remove : `, error),
                            () => debug(`done`));
                },
                () => process.exit(0)
            );
        }

}
