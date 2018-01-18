import * as unit from 'unit.js';

import { test, suite } from 'mocha-typescript';

import { MongoClientService } from '@hapiness/mongo';
import { MinioService, MinioBucketRegion } from '@hapiness/minio';
import { MingoConfig, MingoService } from '../../../src/index';
import { FilesManager } from '../../../src/module/managers/files.manager';

@suite('- Unit MingoServiceTest file')
export class MingoServiceTest {

    @test('- Create the service and get the instance')
    testServiceGetInstance(done) {
        const _mongoClientService: MongoClientService = <any> {};
        const _minioService: MinioService = <any> {};
        const _config: MingoConfig = {};
        const bucketName = 'test.bucket';
        const service = new MingoService(_mongoClientService, _minioService, _config);

        unit.object(service.fromBucket(bucketName)).isInstanceOf(FilesManager);
        unit.object(service['_managers'][`${bucketName}_`]).isInstanceOf(FilesManager);
        done();
    }

    @test('- Call twice the from bucket method and retreive the extact same instance')
    retreivingTwiceTheSameBucketShouldReturnTheSameInstance(done) {
        const _mongoClientService: MongoClientService = <any> {};
        const _minioService: MinioService = <any> {};
        const _config: MingoConfig = {};
        const bucketName = 'test.bucket';
        const bucketRegion = MinioBucketRegion.AP_NORTHEAST_1;

        const service = new MingoService(_mongoClientService, _minioService, _config);
        const firstCall = service.fromBucket(bucketName, bucketRegion);
        const secondCall = service.fromBucket(bucketName, bucketRegion);

        unit.object(firstCall).isInstanceOf(FilesManager);
        unit.object(secondCall).isInstanceOf(FilesManager);
        unit.object(firstCall).isEqualTo(secondCall);
        done();
    }
}
