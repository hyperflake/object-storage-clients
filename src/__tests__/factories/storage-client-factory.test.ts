import sinon from 'sinon';
import { AwsStorageClient, AwsStorageClientOptions } from '../../aws';
import { AzureStorageClient, AzureStorageClientOptions } from '../../azure';
import { DropboxStorageClient, DropboxStorageClientOptions } from '../../dropbox';
import { StorageClientFactory, StorageClientFactoryOptions } from '../../factories';
import { FtpStorageClient, FtpStorageClientOptions } from '../../ftp';
import { OciStorageClient, OciStorageClientOptions } from '../../oci';

describe('StorageClientFactory', () => {
    let awsClientStub: sinon.SinonStub;
    let azureClientStub: sinon.SinonStub;
    let dropboxClientStub: sinon.SinonStub;
    let ftpClientStub: sinon.SinonStub;
    let ociClientStub: sinon.SinonStub;

    beforeEach(() => {
        awsClientStub = sinon.stub(AwsStorageClient.prototype as any, 'constructor');
        azureClientStub = sinon.stub(AzureStorageClient.prototype as any, 'constructor');
        dropboxClientStub = sinon.stub(DropboxStorageClient.prototype as any, 'constructor');
        ftpClientStub = sinon.stub(FtpStorageClient.prototype as any, 'constructor');
        ociClientStub = sinon.stub(OciStorageClient.prototype as any, 'constructor');
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should create an AWS storage client', () => {
        const awsOptions: AwsStorageClientOptions = {
            region: 'us-east-1',
            credentials: {
                accessKeyId: 'testAccessKey',
                secretAccessKey: 'testSecretKey',
            },
        };

        const factoryOptions: StorageClientFactoryOptions = {
            type: 'AWS',
            details: awsOptions,
        };

        const client = StorageClientFactory.getStorageClient(factoryOptions);

        expect(client).toBeInstanceOf(AwsStorageClient);
        expect(awsClientStub.alwaysCalledWithExactly(awsOptions));
    });

    it('should create an Azure storage client', () => {
        const azureOptions: AzureStorageClientOptions = {
            accountName: 'testAccount',
            accountKey: 'testKey',
            endpointSuffix: 'core.windows.net',
        };

        const factoryOptions: StorageClientFactoryOptions = {
            type: 'AZURE',
            details: azureOptions,
        };

        const client = StorageClientFactory.getStorageClient(factoryOptions);

        expect(client).toBeInstanceOf(AzureStorageClient);
        expect(azureClientStub.alwaysCalledWithExactly(azureOptions));
    });

    it('should create a Dropbox storage client', () => {
        const dropboxOptions: DropboxStorageClientOptions = {
            clientId: 'testClientId',
            clientSecret: 'testClientSecret',
            refreshToken: 'testRefreshToken',
        };

        const factoryOptions: StorageClientFactoryOptions = {
            type: 'DROPBOX',
            details: dropboxOptions,
        };

        const client = StorageClientFactory.getStorageClient(factoryOptions);

        expect(client).toBeInstanceOf(DropboxStorageClient);
        expect(dropboxClientStub.alwaysCalledWithExactly(dropboxOptions));
    });

    it('should create an FTP storage client', () => {
        const ftpOptions: FtpStorageClientOptions = {
            host: 'ftp.example.com',
            port: 21,
            username: 'testuser',
            password: 'testpass',
        };

        const factoryOptions: StorageClientFactoryOptions = {
            type: 'FTP',
            details: ftpOptions,
        };

        const client = StorageClientFactory.getStorageClient(factoryOptions);

        expect(client).toBeInstanceOf(FtpStorageClient);
        expect(ftpClientStub.alwaysCalledWithExactly(ftpOptions));
    });

    it('should create an OCI storage client', () => {
        const ociOptions: OciStorageClientOptions = {
            region: 'us-phoenix-1',
            namespace: 'testNamespace',
            credentials: {
                accessKeyId: 'testAccessKey',
                secretAccessKey: 'testSecretKey',
            },
        };

        const factoryOptions: StorageClientFactoryOptions = {
            type: 'OCI',
            details: ociOptions,
        };

        const client = StorageClientFactory.getStorageClient(factoryOptions);

        expect(client).toBeInstanceOf(OciStorageClient);
        expect(ociClientStub.alwaysCalledWithExactly(ociOptions));
    });
});
