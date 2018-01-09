import { MingoFileInterface } from './mingo-file.interface';
import { Document } from 'mongoose';

export interface MingoFileDocumentInterface extends MingoFileInterface, Document {}
