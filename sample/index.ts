import { Hapiness } from '@hapiness/core';
import { MongoClientExt } from '@hapiness/mongo';

import { ApplicationModule } from './application.module';
import { MinioExt } from '@hapiness/minio';

Hapiness.bootstrap(ApplicationModule, [
    MongoClientExt.setConfig({
        load: [
            {
                name: 'mongoose',
                config: {
                    url: 'mongodb://MONGODB_URL:27017',
                    connectionName: 'mingo'
                }
            },
            {
                name: 'mongoose-gridfs',
                config: {
                    url: 'mongodb://MONGODB_URL:27017',
                    connectionName: 'gridfs'
                }
            }
        ]
    }),
    MinioExt.setConfig({
        connection: {
            endPoint: 'MINIO-URL',
            port: 9000,
            useSSL: false,
            accessKey: 'MINIO_ACCESS_KEY',
            secretKey: 'MINIO_SECRET_KEY'
        }
    })
])
.catch(err => {
    console.log('ERR --->', err.stack);
});
