import * as unit from 'unit.js';
import { Observable } from 'rxjs';

export const MinioServiceMock = {
    bucketExists: unit.stub().returns(Observable.of(true)),
    makeBucket: unit.stub().returns(Observable.of(true)),
    putObject: unit.stub().returns(Observable.of('')),
    statObject: unit.stub().returns(Observable.of({ size: 4654 })),
    removeObject: unit.stub().returns(Observable.of(''))
}
