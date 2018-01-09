import { MinioService } from '@hapiness/minio';
import { MinioBucketRegion, MinioStatObject } from '@hapiness/minio';
import { Observable } from 'rxjs/Observable';
import { ReadStream } from 'fs';

export class BucketManager {
  private _name: any;
  private _region: MinioBucketRegion;
  private _asserted: boolean;

  constructor(private _minioService: MinioService) {
    this._asserted = false;
  }

  setName(value: string): BucketManager {
    this._name = value;
    return this;
  }

  getName(): string {
    return this._name;
  }

  setRegion(value: MinioBucketRegion): BucketManager {
    this._region = value;
    return this;
  }

  getRegion(): MinioBucketRegion {
    return this._region;
  }

  getAdapter(): MinioService {
    return this._minioService;
  }

  assert(): Observable<null> {
    return this._asserted ?
      Observable.of(null) : this._minioService.bucketExists(this.getName()).switchMap(exists => {
          if (exists) { return Observable.of(null); }

          return this._minioService.makeBucket(this.getName(), this.getRegion()).map(() => null);
        });
  }

  createFile(input: ReadStream | Buffer | string, filename: string, size?: number, contentType?: string): Observable<MinioStatObject> {
    return this.assert()
      .switchMap(() => this._minioService.putObject(this.getName(), filename, input, size, contentType))
      .switchMap(() => this._minioService.statObject(this.getName(), filename));
  }

  removeFile(filename: string): Observable<boolean> {
    return this.assert().switchMap(() => this._minioService.removeObject(this.getName(), filename));
  }

}
