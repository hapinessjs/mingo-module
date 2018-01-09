import { Observable } from 'rxjs/Observable';
import { ReadStream } from 'fs';
import { Model, DocumentQuery } from 'mongoose';
import { Biim } from '@hapiness/biim';
import { MinioService } from '@hapiness/minio';
import { MongoClientService } from '@hapiness/mongo';
import { MingoFileModel } from '../models/mingo-file.model';
import { BucketManager } from './bucket.manager';
import { MingoFileDocumentInterface, MingoFileInterface } from '../interfaces';

export class FilesManager {
    constructor(
        private _bucketService: BucketManager,
        private _mongoClientService: MongoClientService
    ) { }

    protected _getDocument(): Model<MingoFileDocumentInterface> {
        return this._mongoClientService.getModel({ adapter: 'mongoose' }, MingoFileModel);
    }

    upload(input: ReadStream | Buffer | string, filename, content_type?: string, metadata?: Object): Observable<MingoFileInterface> {
        return this._bucketService
            .createFile(input, filename, null, content_type)
            .switchMap((result): Observable<MingoFileInterface> =>
                Observable.of({
                    filename: filename,
                    size: result.size,
                    content_type: result.contentType,
                    created_at: new Date(result.lastModified),
                    updated_at: new Date(result.lastModified),
                    md5: result.etag,
                    metadata: metadata
                })
            )
            .flatMap(_ => Observable.fromPromise(
                    this._getDocument()
                        .findOneAndUpdate({ filename }, _, { new: true, upsert: true })
                    )
                    .map(file => <MingoFileInterface>file.toJSON())
            );
    }

    create(input: ReadStream | Buffer | string, filename, content_type?: string, metadata?: Object): Observable<MingoFileInterface> {
        return this.exists(filename)
            .flatMap(_ => !!_ ?
                Observable.throw(Biim.conflict(`File ${filename} already exists`)) :
                Observable.of(_)
            )
            .flatMap(_ => this.upload(input, filename, content_type, metadata));
    }

    exists(filename: string): Observable<boolean> {
        return this._bucketService
            .fileStat(filename)
            .flatMap(_ => !_ ?
                Observable.of(false) :
                this.findByFilename(filename)
                    .flatMap(__ => !__ ?
                        Observable.of(false) :
                        Observable.of(true)
                    )
            );
    }

    find(query: any, projection?: string | string[], options?): Observable<MingoFileDocumentInterface> {
        const projectionStr = projection && projection instanceof Array ? projection.join(' ') : projection;
        return Observable
            .fromPromise(this._getDocument()
                .findOne(query, projectionStr, options)
            );
    }

    findByFilename(filename: string, projection?: string | string[], options?): Observable<MingoFileDocumentInterface> {
        const query = { filename };

        return this.find(query, projection, options);
    }

    download(filename: string): Observable<ReadableStream> {
        return this.findByFilename(filename)
            .flatMap(_ => this._bucketService
                .getAdapter()
                .getObject(this._bucketService.getName(), _.filename)
            );
     }

    // What's the update here ? stream or object ? Can you update the document metadata ?
    update(query: any, update, options): Observable<MingoFileInterface> {
        return this
            .find(query, null, options)
            .flatMap(_ => !!_ ?
                Observable.of(_) :
                Observable.throw(Biim.notFound(`No file found for: ${JSON.stringify(query)}`))
            )
            .flatMap(_ => this.upload(update, _.filename, _.content_type, _.metadata));
    }

    updateByFilename(filename: string, data, options: any) {
        const query = { filename };

        return this.update(query, data, options);
     }

    remove(query: any, options: any): Observable<boolean> {
        return Observable
            .fromPromise(this._getDocument().findOneAndRemove(query, null, options))
            .flatMap(_ => !_ ?
                Observable.throw(Biim.notFound(`Couldn't find the document: ${JSON.stringify(query)}`)) :
                Observable.of(_)
                    .flatMap(__ => this._bucketService.removeFile(_.filename))
                    .flatMap(__ => __ ?
                        Observable.of(__) :
                        Observable.throw(Biim.notFound(`Unable to remove file ${_.filename} from file-system.`))
                    )
                    // Should we add back the document to mongo here?
            );
    }

    removeByFilename(filename: string, options: any): Observable<boolean> {
        const query = { filename };

        return this.remove(query, options);
     }
}
