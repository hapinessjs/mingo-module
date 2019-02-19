import { HapinessModule, OnRegister, Inject, Optional, CoreModuleWithProviders } from '@hapiness/core';
import { MinioService, MinioExt, MinioManager } from '@hapiness/minio';
import { MongoClientService, MongoClientExt, MongoManager } from '@hapiness/mongo';
import { MingoService } from './services';
import { MingoFileModel } from './models/mingo-file.model';
import { Observable } from 'rxjs/Observable';
import { MingoConfig, MINGO_MODULE_CONFIG } from './interfaces';
import { FilesRepository } from './repository';

@HapinessModule({
    version: '1.0.0',
    declarations: [
        MingoFileModel
    ],
    imports: [],
    providers: [
        MongoClientService,
        MinioService,
        FilesRepository
    ],
    exports: [
        MingoService,
        FilesRepository
    ]
})
export class MingoModule implements OnRegister {
    public static setConfig(config: MingoConfig): CoreModuleWithProviders {
        return {
            module: MingoModule,
            providers: [{ provide: MINGO_MODULE_CONFIG, useValue: config }]
        }
    }

    constructor(
        @Optional() @Inject(MinioExt) private _minioManager: MinioManager,
        @Optional() @Inject(MongoClientExt) private _mongoManager: MongoManager,
        @Optional() @Inject(MINGO_MODULE_CONFIG) private _config: MingoConfig
    ) {}

    onRegister(): void | Observable<any> {
        if (!this._minioManager) {
            return Observable.throw('@hapiness/minio needs to be set up for mingo to work.');
        }

        const dbConnectionName = this._config && this._config.db && this._config.db.connectionName || null;

        if (!this._mongoManager || !this._mongoManager.getAdapter('mongoose', { connectionName: dbConnectionName })) {
            return Observable.throw('@hapiness/mongo needs to be set up & need a mongoose adapter for mingo to work.');
        }
    }
}
