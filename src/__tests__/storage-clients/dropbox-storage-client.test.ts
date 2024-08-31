import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { DropboxStorageClient } from '../../dropbox';
import { CopyObjectParams, DeleteObjectParams, GetObjectParams, PutObjectParams } from '../../types';
import { Readable } from 'stream';

describe('DropboxStorageClient', () => {
    let dropboxClient: DropboxStorageClient;
    let mock: MockAdapter;

    beforeEach(() => {
        dropboxClient = new DropboxStorageClient({
            clientId: 'testClientId',
            clientSecret: 'testClientSecret',
            refreshToken: 'testRefreshToken',
        });

        mock = new MockAdapter(axios);
    });

    afterEach(() => {
        mock.restore();
    });

    const mockAccessToken = 'mockAccessToken';

    const setupMockAccessToken = () => {
        mock.onPost('https://api.dropbox.com/oauth2/token').reply(200, {
            access_token: mockAccessToken,
        });
    };

    describe('getObject', () => {
        it('should get an object as a stream', async () => {
            setupMockAccessToken();

            const getObjectParams: GetObjectParams = {
                bucket: 'test-bucket',
                key: 'test-key',
            };

            const mockStream = new Readable();
            mockStream.push('test data');
            mockStream.push(null);

            mock.onPost('https://content.dropboxapi.com/2/files/download').reply(200, mockStream);

            expect(dropboxClient.getObject(getObjectParams)).resolves.toBe(mockStream);
        });

        it('should throw an error if Dropbox returns an error', async () => {
            setupMockAccessToken();

            const getObjectParams: GetObjectParams = {
                bucket: 'test-bucket',
                key: 'test-key',
            };

            mock.onPost('https://content.dropboxapi.com/2/files/download').reply(400, {
                error_summary: 'path/not_found/...',
            });

            await expect(dropboxClient.getObject(getObjectParams)).rejects.toThrow('path/not_found/...');
        });
    });

    describe('putObject', () => {
        it('should upload an object', async () => {
            setupMockAccessToken();

            const putObjectParams: PutObjectParams = {
                bucket: 'test-bucket',
                key: 'test-key',
                body: Buffer.from('test data'),
                contentType: 'text/plain',
            };

            mock.onPost('https://content.dropboxapi.com/2/files/upload').reply(200);

            await expect(dropboxClient.putObject(putObjectParams)).resolves.toBeUndefined();
        });

        it('should throw an error if Dropbox returns an error', async () => {
            setupMockAccessToken();

            const putObjectParams: PutObjectParams = {
                bucket: 'test-bucket',
                key: 'test-key',
                body: Buffer.from('test data'),
                contentType: 'text/plain',
            };

            mock.onPost('https://content.dropboxapi.com/2/files/upload').reply(400, {
                error_summary: 'path/conflict/file/...',
            });

            await expect(dropboxClient.putObject(putObjectParams)).rejects.toThrow('path/conflict/file/...');
        });
    });

    describe('copyObject', () => {
        it('should copy an object', async () => {
            setupMockAccessToken();

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

            mock.onPost('https://api.dropboxapi.com/2/files/copy_v2').reply(200);

            await expect(dropboxClient.copyObject(copyObjectParams)).resolves.toBeUndefined();
        });

        it('should throw an error if Dropbox returns an error', async () => {
            setupMockAccessToken();

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

            mock.onPost('https://api.dropboxapi.com/2/files/copy_v2').reply(400, {
                error_summary: 'path/conflict/file/...',
            });

            await expect(dropboxClient.copyObject(copyObjectParams)).rejects.toThrow('path/conflict/file/...');
        });
    });

    describe('deleteObject', () => {
        it('should delete an object', async () => {
            setupMockAccessToken();

            const deleteObjectParams: DeleteObjectParams = {
                bucket: 'test-bucket',
                key: 'test-key',
            };

            mock.onPost('https://api.dropboxapi.com/2/files/delete_v2').reply(200);

            await expect(dropboxClient.deleteObject(deleteObjectParams)).resolves.toBeUndefined();
        });

        it('should throw an error if Dropbox returns an error', async () => {
            setupMockAccessToken();

            const deleteObjectParams: DeleteObjectParams = {
                bucket: 'test-bucket',
                key: 'test-key',
            };

            mock.onPost('https://api.dropboxapi.com/2/files/delete_v2').reply(400, {
                error_summary: 'path/not_found/...',
            });

            await expect(dropboxClient.deleteObject(deleteObjectParams)).rejects.toThrow('path/not_found/...');
        });
    });
});
