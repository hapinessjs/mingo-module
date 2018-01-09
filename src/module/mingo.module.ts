import { HapinessModule } from '@hapiness/core';
import { MinioModule, MinioService } from '@hapiness/minio';
import { MongoModule, MongoClientService } from '@hapiness/mongo';
import { MingoService } from './services';
import { MingoFileModel } from './models/mingo-file.model';

@HapinessModule({
    version: '1.0.0',
    declarations: [
        MingoFileModel
    ],
    imports: [
        MongoModule,
        MinioModule
    ],
    providers: [
        MingoService
    ],
    exports: [
        MingoService,
        MongoClientService,
        MinioService
    ]
})
export class MingoModule {}
