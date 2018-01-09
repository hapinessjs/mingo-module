import { Config } from '@hapiness/config';
import { Model, MongoClientService, MongoModel } from '@hapiness/mongo';

@MongoModel({
    adapter: 'mongoose',
    collection: 'mingo.files'
})
export class MingoFileModel extends Model {

    readonly schema;

    constructor(private mongoClientService: MongoClientService) {
        super(MingoFileModel);

        const dao = this.mongoClientService.getDao(this.connectionOptions);

        this.schema = new dao.Schema(
            {
                filename: {
                    type: String,
                    required: true
                },
                content_type: {
                    type: String,
                    default: 'application/octet-stream'
                },
                created_at: {
                    type: Date,
                    default: new Date()
                },
                updated_at: {
                    type: Date,
                    default: new Date()
                },
                size: {
                    type: Number,
                    default: 0
                },
                metadata: Object,
                md5: {
                    type: String,
                    required: true
                }
            },
            {
                id: false
            }
        );

        this.schema.set('toJSON', { virtuals: true });
    }
}
