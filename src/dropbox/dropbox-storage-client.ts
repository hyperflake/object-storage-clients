import axios from 'axios';
import { StorageClient } from '../interfaces/object-storage-client';
import { CopyObjectParams, DeleteObjectParams, GetObjectParams, PutObjectParams } from '../types';

export interface DropboxStorageClientOptions {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
}

export class DropboxStorageClient implements StorageClient {
    private clientId: string;
    private clientSecret: string;
    private refreshToken: string;

    constructor(options: DropboxStorageClientOptions) {
        this.clientId = options.clientId;
        this.clientSecret = options.clientSecret;
        this.refreshToken = options.refreshToken;
    }

    private async getAccessToken() {
        const options = {
            headers: {
                Authorization: 'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };

        const { data } = await axios.post(
            'https://api.dropbox.com/oauth2/token',
            new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: this.refreshToken,
            }),
            options
        );

        return data.access_token;
    }

    async getObject(params: GetObjectParams): Promise<NodeJS.ReadableStream> {
        const accessToken = await this.getAccessToken();

        const url = 'https://content.dropboxapi.com/2/files/download';

        try {
            const response = await axios.post(url, null, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Dropbox-API-Arg': JSON.stringify({
                        path: `/${params.bucket}/${params.key}`,
                    }),
                },
                responseType: 'stream',
            });

            return response.data; // 'data' is a stream because 'responseType' was set to 'stream'
        } catch (e: any) {
            throw new Error(e.response.data.error_summary);
        }
    }

    async putObject(params: PutObjectParams): Promise<void> {
        const accessToken = await this.getAccessToken();

        const url = 'https://content.dropboxapi.com/2/files/upload';

        try {
            await axios.post(url, params.body, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/octet-stream',
                    'Dropbox-API-Arg': JSON.stringify({
                        path: `/${params.bucket}/${params.key}`,
                        mode: 'overwrite',
                    }),
                },
            });
        } catch (e: any) {
            throw new Error(e.response.data.error_summary);
        }
    }

    async copyObject(params: CopyObjectParams): Promise<void> {
        const accessToken = await this.getAccessToken();

        const url = 'https://api.dropboxapi.com/2/files/copy_v2';

        try {
            await axios.post(
                url,
                {
                    from_path: `/${params.source.bucket}/${params.source.key}`,
                    to_path: `/${params.destination.bucket}/${params.destination.key}`,
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
        } catch (e: any) {
            throw new Error(e.response.data.error_summary);
        }
    }

    async deleteObject(params: DeleteObjectParams): Promise<void> {
        const accessToken = await this.getAccessToken();

        const url = 'https://api.dropboxapi.com/2/files/delete_v2';

        try {
            await axios.post(
                url,
                {
                    path: `/${params.bucket}/${params.key}`,
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
        } catch (e: any) {
            throw new Error(e.response.data.error_summary);
        }
    }
}
