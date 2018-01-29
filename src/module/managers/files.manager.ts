import { Observable } from 'rxjs/Observable';
import { Model, ModelUpdateOptions } from 'mongoose';
import { MongoClientService } from '@hapiness/mongo';
import { Inject, Optional, Injectable } from '@hapiness/core';
import { Biim } from '@hapiness/biim';
import { MingoFileModel } from '../models/mingo-file.model';
import { BucketManager } from './bucket.manager';
import {
    MingoFileDocumentInterface, MingoFileInterface, UploadFileType, MingoConfig, MINGO_MODULE_CONFIG
} from '../interfaces';

@Injectable()
export class FilesManager {
    constructor(
        private _bucketService: BucketManager,
        private _mongoClientService: MongoClientService,
        @Optional() @Inject(MINGO_MODULE_CONFIG) private _config: MingoConfig
    ) { }

    protected _getDocument(): Model<MingoFileDocumentInterface> {
        const options = (this._config && this._config.db && this._config.db.connectionName) ?
            { connectionName: this._config.db.connectionName } :
            null;

        return this._mongoClientService.getModel({ adapter: 'mongoose', options }, MingoFileModel);
    }

    /**
     * Upload a file in mingo and saves metadata in mongodb
     *
     * Index file by filename.
     * Upsert if file does not exists
     * Overwrite if file already exists
     *
     * @param input File source
     * @param filename Filename
     * @param content_type Mime type
     * @param metadata Custom object to store information about the file
     */
    upload(input: UploadFileType, filename: string, content_type?: string, metadata?: Object): Observable<MingoFileInterface> {
        return this._bucketService
            .createFile(input, filename, null, content_type)
            .switchMap((result): Observable<MingoFileInterface> =>
                Observable.of({
                    filename: filename,
                    size: result.size,
                    contentType: result.contentType,
                    created_at: new Date(result.lastModified),
                    updated_at: new Date(result.lastModified),
                    md5: result.etag,
                    metadata: metadata || {}
                })
            )
            .flatMap(_ => Observable.fromPromise(
                    this._getDocument()
                        .findOneAndUpdate({ filename }, _, { new: true, upsert: true })
                    )
                    .map(file => <MingoFileInterface>file.toJSON())
            );
    }

    /**
     * Create a file using upload method. Check that file does not exists before.
     *
     * @param input File source
     * @param filename Filename
     * @param content_type Mime type
     * @param metadata Custom object to store informations about the file
     */
    create(input: UploadFileType, filename, content_type?: string, metadata?: { [key: string]: any}): Observable<MingoFileInterface> {
        return this.exists(filename)
            .flatMap(_ => !!_ ?
                Observable.throw(Biim.conflict(`File ${filename} already exists`)) :
                Observable.of(_)
            )
            .flatMap(_ => this.upload(input, filename, content_type, metadata));
    }

    /**
     * Checks if a file with a given filename already exists
     *
     * @param filename Filename
     */
    exists(filename: string): Observable<boolean> {
        return Observable.of(filename)
            .flatMap(_ => _ ? Observable.of(filename) : Observable.throw(Biim.badRequest(`No filename provided`)))
            .flatMap(_ => this._bucketService.fileStat(filename))
            .catch(err => {
                if (err.code === 'NotFound') {
                    return Observable.of(false);
                }

                return Observable.throw(err);
            })
            .flatMap(_ => !_ ?
                Observable.of(false) :
                this.findByFilename(filename, 'filename')
                    .map(__ => !!__)
            );
        }

    /**
     * Get a list of files matching the query
     *
     * Default limit 10000
     * rxjs concatAll() does not like huge arrays
     *
     * @param query Mongo query object
     * @param projection Fields to return
     * @param options Mongo find options
     */
    find(
        query?: { [key: string]: any }, projection?: string | string[], options?: { [key: string]: any }
    ): Observable<MingoFileDocumentInterface[]> {
        const _options = Object.assign({ limit: 10000 }, options);
        const projectionStr = projection && projection instanceof Array ? projection.join(' ') : projection;

        return Observable.fromPromise(this._getDocument().find(query, projectionStr, _options));
    }

    /**
     * Find a file by filename
     *
     * @param filename Filename
     * @param projection Fields to return
     * @param options Mongo find options
     */
    findByFilename(
        filename: string, projection?: string | string[], options?: { [key: string]: any }
    ): Observable<MingoFileDocumentInterface> {
        const projectionStr = projection && projection instanceof Array ? projection.join(' ') : projection;
        return Observable.fromPromise(this._getDocument().findOne({ filename }, projectionStr, options));
    }

    /**
     * Download file content
     *
     * @param filename Filename
     */
    download(filename: string): Observable<ReadableStream> {
        return this.findByFilename(filename, 'filename')
            .flatMap(_ => this._bucketService
                .getAdapter()
                .getObject(this._bucketService.getName(), _.filename)
            );
     }

    /**
     * Update metadata of files matching query
     *
     * @param query Mongo query object
     * @param update Metadata update object
     * @param options Mongo update options
     */
    update(
        query: { [key: string]: any }, update: { [key: string]: any }, options: ModelUpdateOptions
    ): Observable<MingoFileDocumentInterface[]> {
        return Observable
            .fromPromise(this._getDocument().update(query, { $set: this._prepareUpdateObject(update) }, options))
            .flatMap(_ => this.find(query, null, options));
    }

    /**
     * Update metadata of one files by filename
     *
     * @param query Mongo query object
     * @param update Metadata update object
     * @param options Mongo update options
     */
    updateByFilename(filename: string, update: { [key: string]: any }): Observable<MingoFileDocumentInterface> {
        return this.exists(filename)
            .flatMap(_ => !_ ?
                Observable.throw(Biim.notFound(`Cannot update ${filename}. File does not exist.`)) :
                Observable.fromPromise(this._getDocument()
                    .findOneAndUpdate({ filename },
                        { $set: this._prepareUpdateObject(update) },
                        { new: true, upsert: false }
                    ))
            );
     }

    /**
     * Transform an object for update to avoid erasing data
     *
     * { foo: 'bar', xoxo: { numbers: 1234 } } becomes
     * { 'metadata.foo': 'bar', 'metadata.xoxo': { numbers: 1234 } }
     *
     * It does not rewrite sub objects, only root.
     *
     * @param input Object to reformat
     */
    private _prepareUpdateObject(input: { [key: string]: any }): { [key: string]: any} {
        return Object.entries(input).reduce((acc, [key, value]) => Object.assign({ [`metadata.${key}`]: value }, acc), {});
    }

    /**
     * Remove documents from db and minio
     *
     * @param query Mongo query object
     * @param options Mongo options object
     */
    /* istanbul ignore next */
    remove(query: { [key: string]: any }, options?: Object): Observable<MingoFileDocumentInterface[]> {
        return this.find(query, ['filename'], options)
            .map(files => files.map(file => this.removeByFilename(file.filename)))
            .flatMap(files => Observable.from(files))
            .concatAll()
            .toArray();
    }

    removeByFilename(filename: string): Observable<MingoFileDocumentInterface> {
        return Observable.of(filename)
            .flatMap(_ => _ ? Observable.of(filename) : Observable.throw(Biim.badRequest(`No filename provided`)))
            .flatMap(_ => this.exists(filename))
            .flatMap(_ => !_ ?
                Observable.throw(Biim.notFound(`Cannot remove ${filename}. File does not exist.`)) :
                Observable.fromPromise(this._getDocument().findOneAndRemove({ filename }))
            )
            .flatMap(file =>
                this._bucketService
                    .removeFile(filename)
                    .flatMap(_ => _ ? Observable.of(file) : Observable.throw(Biim.badRequest(`Unable to remove file ${filename}`)))
            );
     }
}
