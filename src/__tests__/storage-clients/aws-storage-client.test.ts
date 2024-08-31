import {
    CopyObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import sinon from 'sinon';
import { Readable } from 'stream';
import { OciStorageClient } from '../../oci';
import { CopyObjectParams, DeleteObjectParams, GetObjectParams, PutObjectParams } from '../../types';

describe('OciStorageClient', () => {
    let s3ClientStub: sinon.SinonStubbedInstance<S3Client>;
    let ociStorageClient: OciStorageClient;

    beforeEach(() => {
        s3ClientStub = sinon.createStubInstance(S3Client);
        ociStorageClient = new OciStorageClient({ region: 'us-east-1', namespace: 'test-namespace' });
        // Replace the internal S3 client with the stub
        (ociStorageClient as any).s3 = s3ClientStub;
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('getObject', () => {
        it('should get an object', async () => {
            const stream = new Readable();

            stream.push('data');
            stream.push(null);

            const getObjectParams: GetObjectParams = {
                bucket: 'test-bucket',
                key: 'test-key',
            };

            s3ClientStub.send.resolves({
                Body: stream,
                $metadata: { httpStatusCode: 200 },
            });

            await expect(ociStorageClient.getObject(getObjectParams)).resolves.toBe(stream);
            expect(s3ClientStub.send.calledOnceWith(sinon.match.instanceOf(GetObjectCommand))).toBe(true);
        });

        it('should throw an error if the body is not a Readable stream', async () => {
            const getObjectParams: GetObjectParams = {
                bucket: 'test-bucket',
                key: 'test-key',
            };

            s3ClientStub.send.resolves({
                Body: {},
                $metadata: { httpStatusCode: 400 },
            });

            await expect(ociStorageClient.getObject(getObjectParams)).rejects.toThrow(Error);
        });
    });

    describe('putObject', () => {
        it('should put an object', async () => {
            const putObjectParams: PutObjectParams = {
                bucket: 'test-bucket',
                key: 'test-key',
                body: 'test-body',
                contentType: 'text/plain',
            };

            s3ClientStub.send.resolves();

            await expect(ociStorageClient.putObject(putObjectParams)).resolves.toBe(undefined);

            expect(s3ClientStub.send.calledOnceWith(sinon.match.instanceOf(PutObjectCommand))).toBe(true);
        });
    });

    describe('copyObject', () => {
        it('should copy an object', async () => {
            const copyObjectParams: CopyObjectParams = {
                source: {
                    bucket: 'source-bucket',
                    key: 'source-key',
                },
                destination: {
                    bucket: 'destination-bucket',
                    key: 'destination-key',
                },
            };

            s3ClientStub.send.resolves();

            await expect(ociStorageClient.copyObject(copyObjectParams)).resolves.toBe(undefined);

            expect(s3ClientStub.send.calledOnceWith(sinon.match.instanceOf(CopyObjectCommand))).toBe(true);
        });
    });

    describe('deleteObject', () => {
        it('should delete an object', async () => {
            const deleteObjectParams: DeleteObjectParams = {
                bucket: 'test-bucket',
                key: 'test-key',
            };

            s3ClientStub.send.resolves();

            await expect(ociStorageClient.deleteObject(deleteObjectParams)).resolves.toBe(undefined);

            expect(s3ClientStub.send.calledOnceWith(sinon.match.instanceOf(DeleteObjectCommand))).toBe(true);
        });
    });
});
