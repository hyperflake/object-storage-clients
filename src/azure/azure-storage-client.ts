import { BlobServiceClient, StorageSharedKeyCredential, BlobClient } from '@azure/storage-blob';
import { StorageClient } from '../interfaces/object-storage-client';
import { CopyObjectParams, DeleteObjectParams, GetObjectParams, PutObjectParams } from '../types';

export interface AzureStorageClientOptions {
    accountName: string;
    accountKey: string;
    endpointSuffix: string;
}

export class AzureStorageClient implements StorageClient {
    private blobServiceClient: BlobServiceClient;

    constructor(options: AzureStorageClientOptions) {
        this.blobServiceClient = new BlobServiceClient(
            `https://${options.accountName}.blob.${options.endpointSuffix}`,
            new StorageSharedKeyCredential(options.accountName, options.accountKey)
        );
    }

    async getObject(params: GetObjectParams): Promise<NodeJS.ReadableStream> {
        const containerClient = this.blobServiceClient.getContainerClient(params.bucket);

        const blobClient = containerClient.getBlobClient(params.key);
        const response = await blobClient.download();

        if (!response.readableStreamBody) {
            throw new Error('Error in AzureStorageClient.getObject. No data stream available for the requested blob.');
        }

        return response.readableStreamBody;
    }

    async putObject(params: PutObjectParams): Promise<void> {
        const containerClient = this.blobServiceClient.getContainerClient(params.bucket);

        const blockBlobClient = containerClient.getBlockBlobClient(params.key);

        await blockBlobClient.upload(params.body, params.body.length);
    }

    async copyObject(params: CopyObjectParams): Promise<void> {
        const destinationContainerClient = this.blobServiceClient.getContainerClient(params.destination.bucket);

        const destinationBlobClient = destinationContainerClient.getBlobClient(params.destination.key);

        const sourceUrl = `https://${this.blobServiceClient.accountName}.blob.${
            this.blobServiceClient.url.split('/')[2]
        }/${params.source.bucket}/${params.source.key}`;

        // Start the copy operation
        await destinationBlobClient.beginCopyFromURL(sourceUrl);
    }

    async deleteObject(params: DeleteObjectParams): Promise<void> {
        const containerClient = this.blobServiceClient.getContainerClient(params.bucket);

        const blobClient = containerClient.getBlobClient(params.key);

        await blobClient.delete();
    }
}
