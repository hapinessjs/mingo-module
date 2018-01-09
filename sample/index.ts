import { Hapiness } from '@hapiness/core';
import { Config } from '@hapiness/config';
import { MongoClientExt } from '@hapiness/mongo';

import { ApplicationModule } from './application.module';
import { MinioExt } from '@hapiness/minio';

export const bootstrap = Hapiness.bootstrap(ApplicationModule, [
    MongoClientExt.setConfig({
        load: [
            {
                name: 'mongoose',
                config: {
                    url: Config.get('mongodb.url')
                }
            }
        ]
    }),
    MinioExt.setConfig(Config.get('minio'))
])
.then(_ => console.log('--->', _))
.catch(err => {
    console.log('ERR --->', err.stack);
});
