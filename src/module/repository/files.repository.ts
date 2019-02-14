
import { Inject, Optional, Injectable } from '@hapiness/core';
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
    constructor(
        private _mongoClientService: MongoClientService,
        @Optional() @Inject(MINGO_MODULE_CONFIG) private _config: MingoConfig
    ) {
        this.maxRetryAttempts = (this._config.db || { maxRetryAttempts: 9 }).maxRetryAttempts;
    }

    protected _getDocument(): Model<MingoFileDocumentInterface> {
        const options = (this._config && this._config.db && this._config.db.connectionName) ?
            { connectionName: this._config.db.connectionName } :
            null;

        return this._mongoClientService.getModel({ adapter: 'mongoose', options }, MingoFileModel);
    }

    /* istanbul ignore next */
    public upsertFileByFilename(filename: string, fileToInsert: MingoFileInterface): Observable<MingoFileInterface> {
        return Observable
            .fromPromise(
                this.retryOnError(() =>
                    this._getDocument().findOneAndUpdate({ filename }, fileToInsert, { new: true, upsert: true })
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
    public findOneFile(
        query: { [key: string]: any },
        projection?: string,
        options?: { [key: string]: any }
    ): Observable<MingoFileInterface> {
        return Observable
            .fromPromise(
                this.retryOnError(() => this._getDocument().findOne(query, projection, options))
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
    public updateFileByFilename(filename: string, update?: { [key: string]: any }): Observable <MingoFileInterface> {
        return Observable.fromPromise(
            this.retryOnError(() => this._getDocument()
                    .findOneAndUpdate({ filename },
                        { $set: this._prepareUpdateObject(update) },
                        { new: true, upsert: false }
                    )
                )
            )
            .map(newFile => newFile ? newFile.toJSON() : newFile);
    }

    /* istanbul ignore next */
    public removeFileByFilename(filename: string): Observable<MingoFileInterface> {
        return Observable
            .fromPromise(
                this.retryOnError(() => this._getDocument().findOneAndRemove({ filename }))
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
    private retryOnError<T>(promiseCb: () => PromiseLikeType<T>, currentAttemptIndex = 0): Promise<T> {
        return promiseCb().catch(err => {
            if (err.message.match(/Request rate is large/) && currentAttemptIndex < this.maxRetryAttempts) {
                return this.delay(currentAttemptIndex * 250).then(() => this.retryOnError(promiseCb, ++currentAttemptIndex));
            } else {
                return Promise.reject(this.formatError(err));
            }
        });
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