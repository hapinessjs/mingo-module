import { Region as MinioRegion } from 'minio'
import { Injectable, Inject, Optional } from '@hapiness/core';
import { MinioService } from '@hapiness/minio';
import { MongoClientService } from '@hapiness/mongo';

import { BucketManager } from '../managers/bucket.manager';
import { FilesManager } from '../managers/files.manager';
import { MingoConfig, MINGO_MODULE_CONFIG } from '../interfaces/index';

@Injectable()
export class MingoService {

    private _managers: { [key: string]: FilesManager } = {};

    constructor(
        private _mongoClientService: MongoClientService,
        private _minioService: MinioService,
        @Optional() @Inject(MINGO_MODULE_CONFIG) private _config: MingoConfig
    ) { }

    fromBucket(name: string, region?: MinioRegion): FilesManager {
        const key = `${name}_${region || ''}`;
        if (this._managers[key]) {
            return this._managers[key];
        }

        const bucketManager = new BucketManager(this._minioService).setName(name).setRegion(region);
        this._managers[key] = new FilesManager(bucketManager, this._mongoClientService, this._config);
        return this._managers[key];
    }
}
