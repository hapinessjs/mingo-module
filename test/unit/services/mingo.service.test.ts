import * as unit from 'unit.js';

import { test, suite } from 'mocha-typescript';
import { MongoClientService } from '@hapiness/mongo';
import { MinioService } from '@hapiness/minio';

import { MingoConfig, MingoService } from '../../../src';
import { FilesManager } from '../../../src/module/managers/files.manager';
import { FilesRepository } from '../../../src/module/repository';

@suite('- Unit MingoServiceTest file')
export class MingoServiceTest {

    @test('- Create the service and get the instance')
    testServiceGetInstance(done) {
        const _minioService: MinioService = <any> {};
        const _filesRepository: FilesRepository = <any> {};
        const bucketName = 'test.bucket';
        const service = new MingoService(_filesRepository, _minioService);

        unit.object(service.fromBucket(bucketName)).isInstanceOf(FilesManager);
        unit.object(service['_managers'][`${bucketName}_`]).isInstanceOf(FilesManager);
        done();
    }

    @test('- Call twice the from bucket method and retreive the extact same instance')
    retreivingTwiceTheSameBucketShouldReturnTheSameInstance(done) {
        const _minioService: MinioService = <any> {};
        const _config: MingoConfig = {};
        const _filesRepository: FilesRepository = <any> {};

        const bucketName = 'test.bucket';
        const bucketRegion = 'ap-northeast-1';

        const service = new MingoService(_filesRepository, _minioService);
        const firstCall = service.fromBucket(bucketName, bucketRegion);
        const secondCall = service.fromBucket(bucketName, bucketRegion);

        unit.object(firstCall).isInstanceOf(FilesManager);
        unit.object(secondCall).isInstanceOf(FilesManager);
        unit.object(firstCall).isEqualTo(secondCall);
        done();
    }
}
