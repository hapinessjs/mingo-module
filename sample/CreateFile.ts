import { MingoService } from '../src/module/services/index';
import { Injectable } from '@hapiness/core';
import { Observable } from 'rxjs';
import { MingoFileInterface } from '../src/module/interfaces/index';

@Injectable()
export class CreateFile {

  constructor(private _mingoService: MingoService) {}

  create(input, filename, metadata) {
    return this._mingoService.fromBucket('test_bucket').upload(input, filename, null, metadata);
  }

  update(filename, data, options) {
    return this._mingoService.fromBucket('test_bucket').updateByFilename(filename, data, options);
  }


}
