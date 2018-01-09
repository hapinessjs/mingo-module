import { HapinessModule, OnRegister, Inject, Optional } from '@hapiness/core';
import { MinioModule, MinioService, MinioExt, MinioManager } from '@hapiness/minio';
import { MongoModule, MongoClientService, MongoClientExt, MongoManager } from '@hapiness/mongo';
import { MingoService } from './services';
import { MingoFileModel } from './models/mingo-file.model';
import { Observable } from 'rxjs/Observable';

@HapinessModule({
    version: '1.0.0',
    declarations: [
        MingoFileModel
    ],
    imports: [
    ],
    providers: [
        MongoClientService,
        MinioService
    ],
    exports: [
        MingoService
    ]
})
export class MingoModule implements OnRegister {

    constructor(
        @Optional() @Inject(MinioExt) private _minioManager: MinioManager,
        @Optional() @Inject(MongoClientExt) private _mongoManager: MongoManager
    ) {

    }

    onRegister(): void | Observable<any> {
        if (!this._minioManager) {
            return Observable.throw('@hapiness/minio needs to be set up for mingo to work.');
        }

        if (!this._mongoManager || !this._mongoManager.getAdapter('mongoose')) {
            return Observable.throw('@hapiness/mongo needs to be set up & need a mongoose adapter for mingo to work.');
        }
    }

}
