import { HapinessModule, OnStart, Inject, HttpServerExt, Server } from '@hapiness/core';
import { MingoModule } from '../src/module/mingo.module';
import { CreateFile } from './CreateFile';
import * as fs from 'fs';
import { MinioService, MinioModule } from '@hapiness/minio';
import { MongoClientService, MongoModule } from '@hapiness/mongo';
import { MingoService } from '../src/index';
import { FilesManager } from '../src/module/managers/files.manager';
import { Observable } from 'rxjs/Observable';
import { ReadStream } from 'fs-extra';

@HapinessModule({
    version: '1.0.0',
    declarations: [],
    imports: [
        MongoModule,
        MinioModule,
        MingoModule
    ],
    providers: [
        // CreateFile
        MingoService
    ],
    exports: []
})
export class ApplicationModule implements OnStart {

    //   constructor(private _createFile: CreateFile) {}
    constructor(private _mingoService: MingoService) { }

    onStart() {
        // this._createFile
        //   .create(fs.createReadStream('./package.json'), 'package.json', { xo: { xa: { foo: 'bar' } } })
        //   .subscribe(_ => console.log(_), err => console.log(err.stack));
        const self = this;
        function fb(): FilesManager {
            return self._mingoService.fromBucket('test.bucket');
        }

        fb().create(fs.createReadStream('./package.json'), 'package.json', 'json', null)
            .flatMap(_ => fb().exists('package.json'))
            .flatMap(_ => fb().findByFilename('package.json'))
            .flatMap(_ => fb().updateByFilename('package.json', './tslint.json', null))
            .flatMap(_ => fb().exists('package.json'))
            .flatMap(_ => fb().download('package.json')
                .flatMap((__: any) => {
                    const ws = fs.createWriteStream('./package.result.json');
                    (__ as ReadStream).pipe(ws);
                    return __;
                })
            )
            .flatMap(_ => fb().removeByFilename('./package.json', null))
            .do(_ => console.log(`DONE ! with result ${_}`));
    }

}
