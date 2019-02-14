import { MinioService } from '@hapiness/minio';
import { BucketItemStat, Region as MinioRegion } from 'minio';
import { Observable } from 'rxjs/Observable';
import { Stream } from 'stream';

export class BucketManager {
  private _name: string;
  private _region: MinioRegion;

  constructor(private _minioService: MinioService) {}

  setName(value: string): BucketManager {
    this._name = value;
    return this;
  }

  getName(): string {
    return this._name;
  }

  setRegion(value: MinioRegion): BucketManager {
    this._region = value;
    return this;
  }

  getRegion(): MinioRegion {
    return this._region;
  }

  getAdapter(): MinioService {
    return this._minioService;
  }

  assert(): Observable<null> {
    return this._minioService
        .bucketExists(this.getName())
        .filter(_ => !_)
        .flatMap(_ => this._minioService
          .makeBucket(this.getName(), this.getRegion())
          .mapTo(null))
        .defaultIfEmpty(null);
  }

  createFile(input: Stream | Buffer | string, filename: string, size?: number, contentType?: string): Observable<BucketItemStat> {
    return this.assert()
      .switchMap(_ => this._minioService.putObject(this.getName(), filename, input, size, contentType))
      .switchMap(_ => this._minioService.statObject(this.getName(), filename));
  }

  fileStat(filename: string): Observable<BucketItemStat> {
    return this.assert()
      .switchMap(_ => this._minioService.statObject(this.getName(), filename));
  }

  removeFile(filename: string): Observable<boolean> {
    return this.assert().switchMap(() => this._minioService.removeObject(this.getName(), filename));
  }
}
