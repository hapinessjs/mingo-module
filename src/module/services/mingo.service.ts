import { MongoClientService } from '@hapiness/mongo';
import { FilesManager } from '../managers/files.manager';
import { BucketManager } from '../managers/bucket.manager';
import { MinioService, MinioBucketRegion } from '@hapiness/minio';
import { Injectable, Inject, Optional } from '@hapiness/core';
import { MingoConfig, MINGO_MODULE_CONFIG } from '../interfaces/index';

@Injectable()
export class MingoService {

    private _managers: { [key: string]: FilesManager } = {};

    constructor(
        private _mongoClientService: MongoClientService,
        private _minioService: MinioService,
        @Optional() @Inject(MINGO_MODULE_CONFIG) private _config: MingoConfig
    ) { }

    fromBucket(name: string, region?: MinioBucketRegion): FilesManager {
        const key = `${name}_${region || ''}`;
        if (this._managers[key]) {
            return this._managers[key];
        }

        const bucketManager = new BucketManager(this._minioService).setName(name).setRegion(region);
        this._managers[key] = new FilesManager(bucketManager, this._mongoClientService, this._config);
        return this._managers[key];
    }
}
