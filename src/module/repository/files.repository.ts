
import { Inject, Optional, Injectable, Hapiness } from '@hapiness/core';
import { MongoClientService } from '@hapiness/mongo';
import { Model, ModelUpdateOptions } from 'mongoose';
import { Observable } from 'rxjs';

import { MingoFileModel } from '../models/mingo-file.model';
import { MingoFileDocumentInterface, MingoFileInterface, MingoConfig, MINGO_MODULE_CONFIG } from '../interfaces';

type PromiseLikeType<T> = PromiseLike<T> &
 { catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>; }
 & { [key: string]: any };

@Injectable()
export class FilesRepository {

    private maxRetryAttempts: number;
    private maxRetryAttemptsNotAuthError: number;

    constructor(
        private _mongoClientService: MongoClientService,
        @Optional() @Inject(MINGO_MODULE_CONFIG) private _config: MingoConfig
    ) {
        this.maxRetryAttempts = (this._config.db || { maxRetryAttempts: 9 }).maxRetryAttempts;
        this.maxRetryAttemptsNotAuthError = (this._config.db || { maxRetryAttemptsNotAuthError: 9 }).maxRetryAttemptsNotAuthError;
    }

    protected _getDocument(): Model<MingoFileDocumentInterface> {
        const options = (this._config && this._config.db && this._config.db.connectionName) ?
            { connectionName: this._config.db.connectionName } :
            null;

        return this._mongoClientService.getModel({ adapter: 'mongoose', options }, MingoFileModel);
    }

    /* istanbul ignore next */
    public upsertFileByFilename(filename: string, bucketName: string, fileToInsert: MingoFileInterface): Observable<MingoFileInterface> {
        return Observable
            .fromPromise(
                this.retryOnError(() =>
                    this._getDocument().findOneAndUpdate({ bucket: bucketName, filename }, fileToInsert, { new: true, upsert: true })
                )
            )
            .map<MingoFileDocumentInterface, MingoFileInterface>(newFile => newFile ? newFile.toJSON() : newFile);
    }

    /* istanbul ignore next */
    public findFiles(
        query?: { [key: string]: any },
        projection?: string,
        options?: { [key: string]: any }
    ): Observable<MingoFileInterface[]> {
        return Observable
            .fromPromise(this.retryOnError(() => this._getDocument().find(query, projection, options)))
            .map<MingoFileDocumentInterface[], MingoFileInterface[]>(files => files.map(file => file ? file.toJSON() : file));
    }

    /* istanbul ignore next */
    public findFileByFilename(
        filename: string,
        bucketName: string,
        projection?: string,
        options?: { [key: string]: any }
    ): Observable<MingoFileInterface> {
        return Observable
            .fromPromise(
                this.retryOnError(() => this._getDocument().findOne({ filename, bucket: bucketName }, projection, options))
            )
            .map<MingoFileDocumentInterface, MingoFileInterface>(file => file ? file.toJSON() : file);
    }

    /* istanbul ignore next */
    public updateFiles(query: { [key: string]: any }, update?: { [key: string]: any }, options?: ModelUpdateOptions): Observable<void> {
        return Observable
            .fromPromise(
                this.retryOnError(() =>
                    this._getDocument().update(query, { $set: this._prepareUpdateObject(update) }, options)
                )
            )
            .mapTo(null);
    }

    /* istanbul ignore next */
    public updateFileByFilename(filename: string, bucketName: string, update?: { [key: string]: any }): Observable <MingoFileInterface> {
        return Observable.fromPromise(
            this.retryOnError(() => this._getDocument()
                    .findOneAndUpdate({ bucket: bucketName, filename },
                        { $set: this._prepareUpdateObject(update) },
                        { new: true, upsert: false }
                    )
                )
            )
            .map(newFile => newFile ? newFile.toJSON() : newFile);
    }

    /* istanbul ignore next */
    public removeFileByFilename(filename: string, bucketName: string): Observable<MingoFileInterface> {
        return Observable
            .fromPromise(
                this.retryOnError(() => this._getDocument().findOneAndRemove({ bucket: bucketName, filename }))
            )
            .map(deletedFile => deletedFile ? deletedFile.toJSON() : deletedFile);
    }

    /**
     * Transform an object for update to avoid erasing data
     *
     * { foo: 'bar', xoxo: { numbers: 1234 } } becomes
     * { 'metadata.foo': 'bar', 'metadata.xoxo': { numbers: 1234 } }
     *
     * It does not rewrite sub objects, only root.
     *
     * @private
     * @param {{ [key: string]: any }} input Object to reformat
     * @returns {{ [key: string]: any}}
     * @memberof FilesRepository
     */
    private _prepareUpdateObject(input: { [key: string]: any }): { [key: string]: any} {
        return Object.entries(input).reduce((acc, [key, value]) => Object.assign({ [`metadata.${key}`]: value }, acc), {});
    }

    /* istanbul ignore next */
    private retryOnError<T>(promiseCb: () => PromiseLikeType<T>, currentAttemptIndex = 0, currentNotAuthAttemptIndex = 0): Promise<T> {
        return promiseCb()
            .catch(err => {
                if (err.message.match(/Request rate is large/) && currentAttemptIndex < this.maxRetryAttempts) {
                    return this.delay(currentAttemptIndex * 250)
                        .then(() => this.retryOnError(promiseCb, ++currentAttemptIndex, currentNotAuthAttemptIndex));
                } else if (err.message.match(/Not Authenticated/) && currentNotAuthAttemptIndex < this.maxRetryAttemptsNotAuthError) {
                    return this.reconnect()
                        .then(() => this.delay(currentNotAuthAttemptIndex * 250))
                        .then(() => this.retryOnError(promiseCb, currentAttemptIndex, ++currentNotAuthAttemptIndex));
                } else {
                    return Promise.reject(this.formatError(err));
                }
            });
    }

    private reconnect(): Promise<void> {
        try {
            const Hapiness = require('@hapiness/core');
            const HappyMongo = require('@hapiness/mongo');
            const MongoExt = (Hapiness.Hapiness.extensions.find(ext => ext.token === HappyMongo.MongoClientExt) || {});
            if (MongoExt && MongoExt.value) {
                const mongoLib = MongoExt.value._adaptersInstances[Object.keys(MongoExt.value._adaptersInstances).shift()];
                return mongoLib.getConnection().close()
                    .then(() => mongoLib.connect()
                        .flatMap(() => mongoLib.whenReady())
                        .do(() => mongoLib.getModelManager().models = [])
                        .flatMap(() => MongoExt.instance.storeDocuments(Hapiness.Hapiness.module))
                        .toPromise()
                    );
            }
        } catch (err) {
            return Promise.reject(err);
        }
    }

    /* istanbul ignore next */
    private delay(value: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 1000 + (value || 0));
        });
    }

    /* istanbul ignore next */
    private formatError(err: Error): Error {
        if (err.message.match(/Request rate is large/)) {
            return new Error('CosmosDB: Request rate is large');
        } else if (err.message.match(/Request size is too large/)) {
            return new Error('CosmosDB: Request size is too large');
        }
        return err;
    }
}
