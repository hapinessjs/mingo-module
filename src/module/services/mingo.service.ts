import {MinioService} from '@hapiness/minio';
import {MongoClientService} from '@hapiness/mongo';
import { FilesManager } from '../managers/files.manager';
import { BucketManager } from '../managers/bucket.manager';
import { MinioBucketRegion } from '@hapiness/minio';
import { Injectable } from '@hapiness/core';

@Injectable()
export class MingoService {

  constructor(private _mongoClientService: MongoClientService, private _minioService: MinioService) {}

  fromBucket(name: string, region?: MinioBucketRegion) {
    const bucketManager = new BucketManager(this._minioService).setName(name).setRegion(region);
    return new FilesManager(bucketManager, this._mongoClientService);
  }

}
