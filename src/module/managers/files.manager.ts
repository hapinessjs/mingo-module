import { Injectable } from '@hapiness/core';
import { Biim } from '@hapiness/biim';
import { Observable } from 'rxjs';
import { Stream } from 'stream';

import { BucketManager } from './bucket.manager';
import { FilesRepository } from '../repository';
import {
    MingoFileDocumentInterface,
    MingoFileInterface,
    UploadFileType,
    ModelUpdateOptions
} from '../interfaces';

@Injectable()
export class FilesManager {

    private subDirectoryName = '';

    constructor(
        private bucketService: BucketManager,
        private fileRepository: FilesRepository
    ) { }

    /**
     *
     * Upload a file in mingo and saves metadata in mongodb
     *
     * Index file by filename.
     * Upsert if file does not exists
     * Overwrite if file already exists
     *
     * @param {UploadFileType} input File source
     * @param {string} filename
     * @param {string} [contentType] Mime type
     * @param {Object} [metadata] Custom object to store information about the file
     * @returns {Observable<MingoFileInterface>}
     * @memberof FilesManager
     */
    upload(input: UploadFileType, filename: string, contentType?: string, metadata?: Object): Observable<MingoFileInterface> {
        return this.bucketService
            .createFile(input, this.getFileFullPath(filename), null, contentType)
            .switchMap((result): Observable<MingoFileInterface> =>
                Observable.of({
                    id: undefined,
                    bucket: this.getBucketNameForMongo(),
                    filename: filename,
                    size: result.size,
                    contentType: result.metaData['content-type'],
                    created_at: new Date(result.lastModified),
                    updated_at: new Date(result.lastModified),
                    md5: result.etag,
                    metadata: metadata || {}
                })
            )
            .flatMap(fileMeta => this.fileRepository.upsertFileByFilename(fileMeta.filename, this.getBucketNameForMongo(), fileMeta));
    }

    /**
     * Create a file using upload method. Check that file does not exists before.
     *
     * @param {UploadFileType} input File source
     * @param {string} filename
     * @param {string} [contentType] Mime type
     * @param {{ [key: string]: any}} [metadata] Custom object to store informations about the file
     * @returns {Observable<MingoFileInterface>}
     * @memberof FilesManager
     */
    create(
        input: UploadFileType,
        filename: string,
        contentType?: string,
        metadata?: { [key: string]: any}
    ): Observable<MingoFileInterface> {
        return this.exists(filename)
            .flatMap(doesFileExist => doesFileExist ?
                Observable.throw(Biim.conflict(`File ${filename} already exists`)) :
                Observable.of(doesFileExist)
            )
            .flatMap(() => this.upload(input, filename, contentType, metadata));
    }

    /**
     * Checks if a file with a given filename already exists
     *
     * @param {string} filename
     * @returns {Observable<boolean>}
     * @memberof FilesManager
     */
    exists(filename: string): Observable<boolean> {
        return Observable.of(null)
            .flatMap(() => filename ? Observable.of(filename) : Observable.throw(Biim.badRequest(`No filename provided`)))
            .flatMap(() => this.bucketService.fileStat(this.getFileFullPath(filename)))
            .catch(err => {
                if (err.code === 'NotFound') {
                    return Observable.of(null);
                }

                return Observable.throw(err);
            })
            .flatMap(fileMeta => !fileMeta ?
                Observable.of(false) :
                this.findByFilename(filename, 'filename')
                    .map(file => !!file)
            );
        }

    /**
     * Get a list of files matching the query
     *
     * Default limit 10000
     * rxjs concatAll() does not like huge arrays
     *
     * @param {{ [key: string]: any }} [query] Mongo query object
     * @param {(string | string[])} [projection] Fields to return
     * @param {{ [key: string]: any }} [options] Mongo find options
     * @returns {Observable<MingoFileInterface[]>}
     * @memberof FilesManager
     */
    find(
        query?: { [key: string]: any }, projection?: string | string[], options?: { [key: string]: any }
    ): Observable<MingoFileInterface[]> {

        const _options = Object.assign({ limit: 10000 }, options);
        const _query = { ...query, bucket: this.getBucketNameForMongo() };
        const projectionStr = projection && projection instanceof Array ? projection.join(' ') : projection as string;
        return this.fileRepository.findFiles(_query, projectionStr, _options);
    }

    /**
     * Find a file by filename
     *
     * @param {string} filename
     * @param {(string | string[])} [projection] Fields to return
     * @param {{ [key: string]: any }} [options] Mongo find options
     * @returns {Observable<MingoFileInterface>}
     * @memberof FilesManager
     */
    findByFilename(
        filename: string, projection?: string | string[], options?: { [key: string]: any }
    ): Observable<MingoFileInterface> {
        const projectionStr = projection && projection instanceof Array ? projection.join(' ') : projection as string;
        return Observable.of(filename)
            .flatMap(fname => !!fname
                ? this.fileRepository
                    .findFileByFilename(
                        filename,
                        this.getBucketNameForMongo(),
                        projectionStr,
                        options
                    )
                : Observable.throw(Biim.badRequest(`No filename provided`))
            );
    }

    /**
     * Download file content
     *
     * @param {string} filename
     * @returns {Observable<Stream>}
     * @memberof FilesManager
     */
    download(filename: string): Observable<Stream> {
        return this.findByFilename(filename, 'filename')
            .flatMap(file => this.bucketService
                .getAdapter()
                .getObject(this.bucketService.getName(), this.getFileFullPath(file.filename))
            );
     }

     /**
     * Update metadata of files matching query
     *
     * @param {{ [key: string]: any }} query Mongo query object
     * @param {{ [key: string]: any }} update Metadata update object
     * @param {ModelUpdateOptions} [options] Mongo update options
     * @returns {Observable <MingoFileInterface[]>}
     * @memberof FilesManager
     */
    update(
        query: { [key: string]: any }, update: { [key: string]: any }, options ?: ModelUpdateOptions
    ): Observable <MingoFileInterface[]> {
        const _query = { ...query, bucket: this.getBucketNameForMongo() };
        return this.fileRepository.updateFiles(_query, update, options)
            .flatMap(() => this.find(_query, null, options));
    }

    /**
     * Update metadata of one files by filename
     *
     * @param {string} filename
     * @param {{ [key: string]: any }} update Metadata update object
     * @returns {Observable <MingoFileInterface>}
     * @memberof FilesManager
     */
    updateByFilename(filename: string, update: { [key: string]: any }): Observable <MingoFileInterface> {
        return this.exists(filename)
            .flatMap(doesFileExist => !doesFileExist ?
                Observable.throw(Biim.notFound(`Cannot update ${filename}. File does not exist.`)) :
                this.fileRepository.updateFileByFilename(filename, this.getBucketNameForMongo(), update)
            );
     }

    /**
     * Remove documents from db and minio
     *
     * @param {{ [key: string]: any }} query Mongo query object
     * @param {Object} [options] Mongo options object
     * @returns {Observable <MingoFileDocumentInterface[]>}
     * @memberof FilesManager
     */
    /* istanbul ignore next */
    remove(query: { [key: string]: any }, options ?: Object): Observable <MingoFileDocumentInterface[]> {
        const _query = { ...query, bucket: this.getBucketNameForMongo() };
        return this.find(_query, ['filename'], options)
            .map(files => files.map(file => this.removeByFilename(file.filename)))
            .flatMap(files => Observable.from(files))
            .concatAll()
            .toArray()
    }

    /**
     * Remove document from db and minio using filename
     *
     * @param {string} filename
     * @returns {Observable<MingoFileDocumentInterface>}
     * @memberof FilesManager
     */
    removeByFilename(filename: string): Observable<MingoFileDocumentInterface> {
        return this.exists(filename)
            .flatMap(doesFileExist => !doesFileExist ?
                Observable.throw(Biim.notFound(`Cannot remove ${filename}. File does not exist.`)) :
                this.fileRepository.removeFileByFilename(filename, this.getBucketNameForMongo())
            )
            .flatMap(file =>
                this.bucketService
                    .removeFile(this.getFileFullPath(filename))
                    .flatMap(removed =>
                        removed
                            ? Observable.of(file)
                            : Observable.throw(Biim.badRequest(`Unable to remove file ${filename}`)))
            );
    }

    setSubDirectoryName(subDirectoryName?: string): this {
        this.subDirectoryName = subDirectoryName ? `${subDirectoryName}/` : '';
        this.subDirectoryName = this.subDirectoryName.replace(/[\/]+$/, '/');

        return this;
    }

    private getFileFullPath(filename: string): string {
        return `${this.subDirectoryName}${filename}`
    }

    private getBucketNameForMongo(): string {
        return this.subDirectoryName || this.bucketService.getName();
    }
}
