import { createReadStream } from "node:fs";

import {
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  NoSuchKey,
  S3Client
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

import { loadEnvFiles, type Environment } from "./env.js";
import { getOriginalObjectInfo } from "./originals.js";
import { loadProjectConfig } from "./project-config.js";
import { readGallerySource } from "./source.js";

export interface StoredObject {
  key: string;
}

export interface PutObjectInput {
  cacheControl?: string;
  contentType: string;
  key: string;
  path: string;
}

export interface ObjectStorageClient {
  deleteObject(key: string): Promise<void>;
  headObject(key: string): Promise<StoredObject | undefined>;
  listObjects(prefix: string): Promise<StoredObject[]>;
  putObject(input: PutObjectInput): Promise<void>;
}

export interface SyncOriginalsToS3Progress {
  completed: number;
  currentKey: string;
  skipped: number;
  status: "skipped" | "uploaded";
  total: number;
  uploaded: number;
}

export interface SyncOriginalsToS3Options {
  bucketName: string;
  client: ObjectStorageClient;
  onProgress?: ((progress: SyncOriginalsToS3Progress) => void) | undefined;
  originalPrefix: string;
  prune?: boolean | undefined;
  publicBaseUrl?: string | undefined;
  sourceDir: string;
}

export interface SyncOriginalsToS3Result {
  bucketName: string;
  deleted: number;
  objects: StoredObject[];
  skipped: number;
  uploaded: number;
}

export interface S3UploadEnv {
  accessKeyId: string;
  bucketName: string;
  endpoint: string;
  secretAccessKey: string;
}

export class S3ObjectStorageClient implements ObjectStorageClient {
  private readonly bucketName: string;
  private readonly s3: S3Client;

  constructor(config: S3UploadEnv) {
    this.bucketName = config.bucketName;
    this.s3 = new S3Client({
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      },
      endpoint: config.endpoint,
      forcePathStyle: true,
      region: "auto"
    });
  }

  async deleteObject(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: key }));
  }

  async headObject(key: string): Promise<StoredObject | undefined> {
    try {
      await this.s3.send(new HeadObjectCommand({ Bucket: this.bucketName, Key: key }));
      return { key };
    } catch (error) {
      if (error instanceof NoSuchKey || hasHttpStatus(error, 404)) {
        return undefined;
      }

      throw error;
    }
  }

  async listObjects(prefix: string): Promise<StoredObject[]> {
    const objects: StoredObject[] = [];
    let continuationToken: string | undefined;

    do {
      const response = await this.s3.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          ContinuationToken: continuationToken,
          Prefix: prefix
        })
      );

      for (const object of response.Contents ?? []) {
        if (object.Key !== undefined) {
          objects.push({ key: object.Key });
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken !== undefined);

    return objects;
  }

  async putObject(input: PutObjectInput): Promise<void> {
    await new Upload({
      client: this.s3,
      params: {
        Body: createReadStream(input.path),
        Bucket: this.bucketName,
        CacheControl: input.cacheControl,
        ContentType: input.contentType,
        Key: input.key
      }
    }).done();
  }
}

export async function syncOriginalsToS3(
  options: SyncOriginalsToS3Options
): Promise<SyncOriginalsToS3Result> {
  const source = await readGallerySource({ sourceDir: options.sourceDir });
  const objects: StoredObject[] = [];
  const desiredKeys = new Set<string>();
  const total = source.photos.length;
  let skipped = 0;
  let uploaded = 0;

  for (const photo of source.photos) {
    const object = await getOriginalObjectInfo(photo, {
      originalPrefix: options.originalPrefix,
      ...(options.publicBaseUrl === undefined ? {} : { publicBaseUrl: options.publicBaseUrl })
    });
    desiredKeys.add(object.key);
    objects.push({ key: object.key });

    if ((await options.client.headObject(object.key)) !== undefined) {
      skipped += 1;
      options.onProgress?.({
        completed: uploaded + skipped,
        currentKey: object.key,
        skipped,
        status: "skipped",
        total,
        uploaded
      });
      continue;
    }

    await options.client.putObject({
      cacheControl: "public, max-age=31536000, immutable",
      contentType: object.contentType,
      key: object.key,
      path: photo.sourcePath
    });
    uploaded += 1;
    options.onProgress?.({
      completed: uploaded + skipped,
      currentKey: object.key,
      skipped,
      status: "uploaded",
      total,
      uploaded
    });
  }

  let deleted = 0;

  if (options.prune === true) {
    const existing = await options.client.listObjects(
      `${normalizePrefix(options.originalPrefix)}/`
    );

    for (const object of existing) {
      if (!desiredKeys.has(object.key)) {
        await options.client.deleteObject(object.key);
        deleted += 1;
      }
    }
  }

  return {
    bucketName: options.bucketName,
    deleted,
    objects,
    skipped,
    uploaded
  };
}

export async function uploadOriginalsToS3(options: {
  env?: Environment | undefined;
  onProgress?: ((progress: SyncOriginalsToS3Progress) => void) | undefined;
  prune?: boolean | undefined;
  sourceDir?: string | undefined;
}): Promise<SyncOriginalsToS3Result> {
  const env = loadEnvFiles({ env: options.env });
  const projectConfig = loadProjectConfig({ env });
  const uploadConfig = resolveS3UploadEnv(env);
  const client = new S3ObjectStorageClient(uploadConfig);

  return syncOriginalsToS3({
    bucketName: uploadConfig.bucketName,
    client,
    ...(options.onProgress === undefined ? {} : { onProgress: options.onProgress }),
    originalPrefix: projectConfig.storage.originalPrefix,
    ...(options.prune === undefined ? {} : { prune: options.prune }),
    ...(projectConfig.storage.publicBaseUrl === undefined
      ? {}
      : { publicBaseUrl: projectConfig.storage.publicBaseUrl }),
    sourceDir: options.sourceDir ?? projectConfig.sourceDir
  });
}

export function resolveS3UploadEnv(env: Environment): S3UploadEnv {
  const accessKeyId = env.S3_ACCESS_KEY_ID;
  const secretAccessKey = env.S3_SECRET_ACCESS_KEY;
  const bucketName = env.S3_BUCKET;
  const endpoint = env.S3_ENDPOINT;

  if (accessKeyId === undefined || accessKeyId.length === 0) {
    throw new Error("Missing S3 access key id. Set S3_ACCESS_KEY_ID.");
  }

  if (secretAccessKey === undefined || secretAccessKey.length === 0) {
    throw new Error("Missing S3 secret access key. Set S3_SECRET_ACCESS_KEY.");
  }

  if (bucketName === undefined || bucketName.length === 0) {
    throw new Error("Missing S3 bucket name. Set S3_BUCKET.");
  }

  if (endpoint === undefined || endpoint.length === 0) {
    throw new Error(
      "Missing S3 endpoint. Set S3_ENDPOINT, for example https://<account-id>.r2.cloudflarestorage.com for Cloudflare R2."
    );
  }

  return {
    accessKeyId,
    bucketName,
    endpoint,
    secretAccessKey
  };
}

function normalizePrefix(prefix: string): string {
  return prefix.replace(/^\/+|\/+$/gu, "");
}

function hasHttpStatus(error: unknown, status: number): boolean {
  if (typeof error !== "object" || error === null || !("$metadata" in error)) {
    return false;
  }

  const metadata = (error as { $metadata?: { httpStatusCode?: number } }).$metadata;
  return metadata?.httpStatusCode === status;
}
