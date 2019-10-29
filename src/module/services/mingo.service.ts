import { Region as MinioRegion } from 'minio'
import { Injectable } from '@hapiness/core';
import { MinioService } from '@hapiness/minio';

import { BucketManager } from '../managers/bucket.manager';
import { FilesManager } from '../managers/files.manager';
import { FilesRepository } from '../repository';

@Injectable()
export class MingoService {

    private _managers: { [key: string]: FilesManager } = {};

    constructor(
        private filesRepository: FilesRepository,
        private minioService: MinioService
    ) { }

    fromBucket(name: string, subDirectoryName?: string, region?: MinioRegion): FilesManager {
        const key = `${name}_${subDirectoryName || ''}_${region || ''}`;
        if (this._managers[key]) {
            return this._managers[key];
        }

        const bucketManager = new BucketManager(this.minioService).setName(name).setRegion(region);
        this._managers[key] = new FilesManager(bucketManager, this.filesRepository).setSubDirectoryName(subDirectoryName);

        return this._managers[key];
    }
}
