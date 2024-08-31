import { Client, FTPResponse } from 'basic-ftp';
import sinon from 'sinon';
import { PassThrough } from 'stream';
import { FtpStorageClient } from '../../ftp';
import { CopyObjectParams, DeleteObjectParams, GetObjectParams, PutObjectParams } from '../../types';

describe('FtpStorageClient', () => {
    let ftpClientStub: sinon.SinonStubbedInstance<Client>;
    let ftpStorageClient: FtpStorageClient;

    beforeEach(() => {
        ftpClientStub = sinon.createStubInstance(Client);
        ftpStorageClient = new FtpStorageClient({
            host: 'ftp.example.com',
            port: 21,
            username: 'testuser',
            password: 'testpass',
        });
        // Replace the internal FTP client with the stub
        (ftpStorageClient as any).ftpClient = ftpClientStub;
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('getObject', () => {
        it('should get an object', async () => {
            const stream = new PassThrough();

            const getObjectParams: GetObjectParams = {
                bucket: 'test-bucket',
                key: 'test-key',
            };

            ftpClientStub.downloadTo.callsFake(async (destination) => {
                if (typeof destination !== 'string') {
                    stream.pipe(destination);
                    stream.end('test data');
                }

                return { code: 200, message: 'Success' } as FTPResponse;
            });

            const resultStream = await ftpStorageClient.getObject(getObjectParams);

            let data = '';
            resultStream.on('data', (chunk) => {
                data += chunk.toString();
            });

            await new Promise((resolve) => resultStream.on('end', resolve));

            expect(data).toEqual('test data');
            expect(
                ftpClientStub.downloadTo.calledOnceWith(sinon.match.instanceOf(PassThrough), 'test-bucket/test-key')
            ).toBe(true);
        });

        it('should throw an error if download fails', async () => {
            const getObjectParams: GetObjectParams = {
                bucket: 'test-bucket',
                key: 'test-key',
            };

            ftpClientStub.downloadTo.rejects(new Error('Download failed'));

            await expect(ftpStorageClient.getObject(getObjectParams)).rejects.toThrow('Download failed');
        });
    });

    describe('putObject', () => {
        it('should put an object', async () => {
            const putObjectParams: PutObjectParams = {
                bucket: 'test-bucket',
                key: 'test-key',
                body: Buffer.from('test data'),
                contentType: 'text/plain',
            };

            ftpClientStub.uploadFrom.resolves();

            await expect(ftpStorageClient.putObject(putObjectParams)).resolves.toBe(undefined);

            // expect(ftpClientStub.uploadFrom.calledOnceWith(Buffer.from('test data'), 'test-bucket/test-key')).toBe(
            //     true
            // );
        });

        it('should throw an error if upload fails', async () => {
            const putObjectParams: PutObjectParams = {
                bucket: 'test-bucket',
                key: 'test-key',
                body: Buffer.from('test data'),
                contentType: 'text/plain',
            };

            ftpClientStub.uploadFrom.rejects(new Error('Upload failed'));

            await expect(ftpStorageClient.putObject(putObjectParams)).rejects.toThrow('Upload failed');
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

            const sourceStream = new PassThrough();

            ftpClientStub.downloadTo.callsFake(async (destination) => {
                if (typeof destination !== 'string') {
                    sourceStream.pipe(destination);
                    sourceStream.end();
                }
                return { code: 200, message: 'Success' } as FTPResponse;
            });

            ftpClientStub.uploadFrom.resolves();

            await expect(ftpStorageClient.copyObject(copyObjectParams)).resolves.toBe(undefined);

            expect(
                ftpClientStub.downloadTo.calledOnceWith(sinon.match.instanceOf(PassThrough), 'source-bucket/source-key')
            ).toBe(true);
            expect(
                ftpClientStub.uploadFrom.calledOnceWith(
                    sinon.match.instanceOf(PassThrough),
                    'destination-bucket/destination-key'
                )
            ).toBe(true);
        });

        it('should throw an error if copying fails', async () => {
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

            ftpClientStub.downloadTo.rejects(new Error('Copy failed'));

            await expect(ftpStorageClient.copyObject(copyObjectParams)).rejects.toThrow('Copy failed');
        });
    });

    describe('deleteObject', () => {
        it('should delete an object', async () => {
            const deleteObjectParams: DeleteObjectParams = {
                bucket: 'test-bucket',
                key: 'test-key',
            };

            ftpClientStub.remove.resolves();

            await expect(ftpStorageClient.deleteObject(deleteObjectParams)).resolves.toBe(undefined);

            expect(ftpClientStub.remove.calledOnceWith('test-bucket/test-key')).toBe(true);
        });

        it('should throw an error if deletion fails', async () => {
            const deleteObjectParams: DeleteObjectParams = {
                bucket: 'test-bucket',
                key: 'test-key',
            };

            ftpClientStub.remove.rejects(new Error('Delete failed'));

            await expect(ftpStorageClient.deleteObject(deleteObjectParams)).rejects.toThrow('Delete failed');
        });
    });
});
