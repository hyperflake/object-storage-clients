import { Client } from 'basic-ftp';
import { PassThrough } from 'stream';
import { StorageClient } from '../interfaces/object-storage-client';
import { CopyObjectParams, DeleteObjectParams, GetObjectParams, PutObjectParams } from '../types';

export interface FtpStorageClientOptions {
    host: string;
    port: number;
    username: string;
    password: string;
}

export class FtpStorageClient implements StorageClient {
    private options: FtpStorageClientOptions;
    private ftpClient: Client;

    constructor(options: FtpStorageClientOptions) {
        this.options = options;
        this.ftpClient = new Client();
    }

    // Connect to the FTP server
    private async connect(): Promise<void> {
        await this.ftpClient.access({
            host: this.options.host,
            port: this.options.port,
            user: this.options.username,
            password: this.options.password,
        });
    }

    // Disconnect from the FTP server
    private async disconnect(): Promise<void> {
        await this.ftpClient.close();
    }

    // Returns a readable stream containing data from the specified path on the FTP server
    async getObject(params: GetObjectParams): Promise<NodeJS.ReadableStream> {
        await this.connect();

        const passThrough = new PassThrough();

        try {
            await this.ftpClient.downloadTo(passThrough, `${params.bucket}/${params.key}`);
        } catch (error) {
            passThrough.emit('error', error);
        } finally {
            await this.disconnect();

            passThrough.end();
        }

        return passThrough;
    }

    // Uploads data to the specified path on the FTP server
    async putObject(params: PutObjectParams): Promise<void> {
        await this.connect();

        await this.ftpClient.uploadFrom(params.body, `${params.bucket}/${params.key}`);

        await this.disconnect();
    }

    async copyObject(params: CopyObjectParams): Promise<void> {
        await this.connect();

        const passThrough = new PassThrough();
        const sourcePath = `${params.source.bucket}/${params.source.key}`;
        const destinationPath = `${params.destination.bucket}/${params.destination.key}`;

        try {
            // Download the source file to a PassThrough stream
            await this.ftpClient.downloadTo(passThrough, sourcePath);

            // Once the download is finished, upload from the PassThrough stream to the destination

            passThrough.end(); // Ensure the passThrough stream is ended properly

            await this.ftpClient.uploadFrom(passThrough, destinationPath);
        } catch (error) {
            throw error; // Rethrow the error for further handling
        } finally {
            await this.disconnect();
        }
    }

    // Deletes a file at the specified path on the FTP server
    async deleteObject(params: DeleteObjectParams): Promise<void> {
        await this.connect();

        await this.ftpClient.remove(`${params.bucket}/${params.key}`);

        await this.disconnect();
    }
}
