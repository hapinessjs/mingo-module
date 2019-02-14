import { Stream } from 'stream';
import { ModelUpdateOptions } from 'mongoose';

export type UploadFileType = Stream | Buffer | string;
export type ModelUpdateOptions = ModelUpdateOptions;
