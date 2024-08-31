import { AwsStorageClient, AwsStorageClientOptions } from '../aws';
import { AzureStorageClient, AzureStorageClientOptions } from '../azure';
import { DropboxStorageClient, DropboxStorageClientOptions } from '../dropbox';
import { FtpStorageClient, FtpStorageClientOptions } from '../ftp';
import { OciStorageClient, OciStorageClientOptions } from '../oci';

export interface StorageClientFactoryOptions {
    type: 'AWS' | 'AZURE' | 'DROPBOX' | 'FTP' | 'OCI';
    details:
        | AwsStorageClientOptions
        | AzureStorageClientOptions
        | DropboxStorageClientOptions
        | FtpStorageClientOptions
        | OciStorageClientOptions;
}
export class StorageClientFactory {
    static getStorageClient(params: StorageClientFactoryOptions) {
        if (params.type === 'AWS') {
            const details = params.details as AwsStorageClientOptions;

            return new AwsStorageClient({
                region: details.region,
                credentials: details.credentials,
            });
        }

        if (params.type === 'AZURE') {
            const details = params.details as AzureStorageClientOptions;

            return new AzureStorageClient({
                accountName: details.accountName,
                accountKey: details.accountKey,
                endpointSuffix: details.endpointSuffix,
            });
        }

        if (params.type === 'DROPBOX') {
            const details = params.details as DropboxStorageClientOptions;

            return new DropboxStorageClient({
                refreshToken: details.refreshToken,
                clientId: details.clientId,
                clientSecret: details.clientSecret,
            });
        }

        if (params.type === 'FTP') {
            const details = params.details as FtpStorageClientOptions;

            return new FtpStorageClient({
                host: details.host,
                port: details.port,
                username: details.username,
                password: details.password,
            });
        }

        if (params.type === 'OCI') {
            const details = params.details as OciStorageClientOptions;

            return new OciStorageClient({
                region: details.region,
                namespace: details.namespace,
                credentials: details.credentials,
            });
        }
    }
}
