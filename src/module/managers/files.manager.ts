import { Observable } from 'rxjs/Observable';
import { ReadStream } from 'fs';
import { Model } from 'mongoose';
import {MinioService} from '@hapiness/minio';
import { MongoClientService } from '@hapiness/mongo';
import { MingoFileModel } from '../models/mingo-file.model';
import { BucketManager } from './bucket.manager';
import { MingoFileDocumentInterface, MingoFileInterface } from '../interfaces';

export class FilesManager {
  constructor(
    private _bucketService: BucketManager,
    private _mongoClientService: MongoClientService
  ) {}

  protected _getDocument(): Model<MingoFileDocumentInterface> {
    return this._mongoClientService.getModel({ adapter: 'mongoose' }, MingoFileModel);
  }

  upload(input: ReadStream | Buffer | string, filename, content_type?: string, metadata?: Object): Observable<MingoFileInterface> {
    return this._bucketService
      .createFile(input, filename, null, content_type)
      .switchMap((result) => {
        const newFile: MingoFileInterface = <any>{};
        newFile.filename = filename;
        newFile.size = result.size;
        newFile.content_type = result.contentType;
        newFile.created_at = new Date(result.lastModified);
        newFile.updated_at = new Date(result.lastModified);
        newFile.md5 = result.etag;
        newFile.metadata = metadata;

        return Observable.fromPromise(
          this._getDocument().findOneAndUpdate({ filename }, newFile, { new: true })).map(file => <MingoFileInterface>file.toJSON()
        );
      });
  }

  find(query, projection, options) {}
  findByFilename(filename, projection, options) {}

  download(filename) {}

  update(query, update, options) {}
  updateByFilename(filename, data, options) {}

  remove(query, options) {}
  removeByFilename(filename, options) {}
}
