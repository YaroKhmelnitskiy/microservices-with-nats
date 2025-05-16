export interface S3BaseConfig {
	accessKeyId: string;
	secretAccessKey: string;
	region: string;
	s3Url: string;
}

export interface S3BucketConfig {
	bucket?: string;
}

export interface S3Config extends S3BaseConfig, S3BucketConfig {}
