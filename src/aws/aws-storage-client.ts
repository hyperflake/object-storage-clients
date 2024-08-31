import {
    CopyObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { StorageClient } from '../interfaces/object-storage-client';
import { CopyObjectParams, DeleteObjectParams, GetObjectParams, PutObjectParams } from '../types';

export interface AwsStorageClientOptions {
    region: string;
    credentials?: {
        accessKeyId: string;
        secretAccessKey: string;
    };
}
export class AwsStorageClient implements StorageClient {
    private s3: S3Client;

    constructor(options: AwsStorageClientOptions) {
        this.s3 = new S3Client({
            region: options.region,
            credentials: options.credentials,
        });
    }

    async getObject(params: GetObjectParams): Promise<NodeJS.ReadableStream> {
        const command = new GetObjectCommand({
            Bucket: params.bucket,
            Key: params.key,
        });

        const response = await this.s3.send(command);

        if (!(response.Body instanceof Readable)) {
            throw new Error(
                `Error in AwsStorageClient.getObject. Status received: ${response?.$metadata?.httpStatusCode}`
            );
        }
        return response.Body;
    }

    async putObject(params: PutObjectParams): Promise<void> {
        const command = new PutObjectCommand({
            Bucket: params.bucket,
            Key: params.key,
            Body: params.body,
            ContentType: params.contentType,
        });

        await this.s3.send(command);
    }

    async copyObject(params: CopyObjectParams): Promise<void> {
        const command = new CopyObjectCommand({
            Bucket: params.destination.bucket,
            Key: params.destination.key,
            CopySource: encodeURIComponent(`${params.source.bucket}/${params.source.key}`),
        });

        await this.s3.send(command);
    }

    async deleteObject(params: DeleteObjectParams): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: params.bucket,
            Key: params.key,
        });

        await this.s3.send(command);
    }
}
