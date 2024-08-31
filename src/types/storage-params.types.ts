export interface GetObjectParams {
    bucket: string;
    key: string;
}

export interface PutObjectParams {
    bucket: string;
    key: string;
    body: any;
    contentType?: string;
}

export interface CopyObjectParams {
    source: {
        bucket: string;
        key: string;
    };
    destination: {
        bucket: string;
        key: string;
    };
}

export interface DeleteObjectParams {
    bucket: string;
    key: string;
}
