import * as prepare from 'mocha-prepare';
import { MongoTestUtils } from '@hapiness/mongo';

prepare(
    done => {
        MongoTestUtils.startMongo(done);
        console.log('=== MONGOD START ===');
    },
    done => {
        MongoTestUtils.stopMongo(done);
        console.log('=== MONGOD KILL ===');
        setTimeout(() => process.exit(), 1500);
    }
);
