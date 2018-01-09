import { MongoClientService } from '@hapiness/mongo';
import { FilesManager } from '../managers/files.manager';
import { BucketManager } from '../managers/bucket.manager';
import { MinioService, MinioBucketRegion } from '@hapiness/minio';
import { Injectable, Inject } from '@hapiness/core';
// import { MingoExt } from '../mingo.extension';

@Injectable()
export class MingoService {

    private _managers: { [key: string]: FilesManager } = {};

    constructor(
        private _mongoClientService: MongoClientService,
        private _minioService: MinioService
    ) { }

    fromBucket(name: string, region?: MinioBucketRegion): FilesManager {
        const key = `${name}_${region || ''}`;
        if (this._managers[key]) {
            return this._managers[key];
        }

        const bucketManager = new BucketManager(this._minioService).setName(name).setRegion(region);
        this._managers[key] = new FilesManager(bucketManager, this._mongoClientService);
        return this._managers[key];
    }
}
