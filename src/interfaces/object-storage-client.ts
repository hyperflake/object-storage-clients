import { CopyObjectParams, DeleteObjectParams, GetObjectParams, PutObjectParams } from '../types';

export interface StorageClient {
    getObject(params: GetObjectParams): Promise<NodeJS.ReadableStream>;

    putObject(params: PutObjectParams): Promise<void>;

    copyObject(params: CopyObjectParams): Promise<void>;

    deleteObject(params: DeleteObjectParams): Promise<void>;
}
