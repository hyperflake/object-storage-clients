import { BlobClient, BlobServiceClient, BlockBlobClient, ContainerClient } from '@azure/storage-blob';
import sinon from 'sinon';
import { AzureStorageClient } from '../../azure';
import { CopyObjectParams, DeleteObjectParams, GetObjectParams, PutObjectParams } from '../../types';
import { Readable } from 'stream';

describe('AzureStorageClient', () => {
    let blobServiceClientStub: sinon.SinonStubbedInstance<BlobServiceClient>;
    let containerClientStub: sinon.SinonStubbedInstance<ContainerClient>;
    let blobClientStub: sinon.SinonStubbedInstance<BlobClient>;
    let blockBlobClientStub: sinon.SinonStubbedInstance<BlockBlobClient>;
    let azureStorageClient: AzureStorageClient;

    beforeEach(() => {
        // Create stubs for the Azure SDK classes
        blobServiceClientStub = sinon.createStubInstance(BlobServiceClient);
        containerClientStub = sinon.createStubInstance(ContainerClient);
        blobClientStub = sinon.createStubInstance(BlobClient);
        blockBlobClientStub = sinon.createStubInstance(BlockBlobClient);

        // Mock the `accountName` and `url` properties on the BlobServiceClient
        Object.defineProperty(blobServiceClientStub, 'accountName', {
            value: 'testaccount',
        });

        Object.defineProperty(blobServiceClientStub, 'url', {
            value: 'https://testaccount.blob.core.windows.net',
        });

        // Replace actual client creation with stubs
        sinon.stub(BlobServiceClient, 'fromConnectionString').returns(blobServiceClientStub as any);

        azureStorageClient = new AzureStorageClient({
            accountName: 'testaccount',
            accountKey: 'testkey',
            endpointSuffix: 'core.windows.net',
        });

        (azureStorageClient as any).blobServiceClient = blobServiceClientStub;

        blobServiceClientStub.getContainerClient.returns(containerClientStub);
        containerClientStub.getBlobClient.returns(blobClientStub);
        containerClientStub.getBlockBlobClient.returns(blockBlobClientStub);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('getObject', () => {
        it('should get an object', async () => {
            const stream = new Readable();
            stream.push('data');
            stream.push(null);

            blobClientStub.download.resolves({
                readableStreamBody: stream,
            } as any);

            const getObjectParams: GetObjectParams = {
                bucket: 'test-container',
                key: 'test-blob',
            };

            await expect(azureStorageClient.getObject(getObjectParams)).resolves.toBe(stream);
            expect(blobClientStub.download.calledOnce).toBe(true);
        });

        it('should throw an error if the body is not a Readable stream', async () => {
            blobClientStub.download.resolves({
                readableStreamBody: undefined,
            } as any);

            const getObjectParams: GetObjectParams = {
                bucket: 'test-container',
                key: 'test-blob',
            };

            await expect(azureStorageClient.getObject(getObjectParams)).rejects.toThrow(Error);
        });
    });

    describe('putObject', () => {
        it('should put an object', async () => {
            const putObjectParams: PutObjectParams = {
                bucket: 'test-container',
                key: 'test-blob',
                body: Buffer.from('test-data'),
                contentType: 'text/plain',
            };

            blockBlobClientStub.upload.resolves();

            await expect(azureStorageClient.putObject(putObjectParams)).resolves.toBe(undefined);

            expect(
                blockBlobClientStub.upload.calledOnceWith(Buffer.from('test-data'), Buffer.from('test-data').length)
            ).toBe(true);
        });
    });

    describe('copyObject', () => {
        it('should copy an object', async () => {
            const copyObjectParams: CopyObjectParams = {
                source: {
                    bucket: 'source-container',
                    key: 'source-blob',
                },
                destination: {
                    bucket: 'destination-container',
                    key: 'destination-blob',
                },
            };

            blobClientStub.beginCopyFromURL.resolves();

            await expect(azureStorageClient.copyObject(copyObjectParams)).resolves.toBe(undefined);
        });
    });

    describe('deleteObject', () => {
        it('should delete an object', async () => {
            const deleteObjectParams: DeleteObjectParams = {
                bucket: 'test-container',
                key: 'test-blob',
            };

            blobClientStub.delete.resolves();

            await expect(azureStorageClient.deleteObject(deleteObjectParams)).resolves.toBe(undefined);

            expect(blobClientStub.delete.calledOnce).toBe(true);
        });
    });
});
