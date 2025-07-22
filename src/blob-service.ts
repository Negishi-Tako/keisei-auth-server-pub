import { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from '@azure/storage-blob';
import { BlobSASSignatureValues } from '@azure/storage-blob';
import 'dotenv/config';
import type { ContainerSASOptions, SASUrlResponse } from './types';

class BlobService {
  private static instance: BlobService;
  private blobServiceClient: BlobServiceClient | null = null;
  private accountName: string;
  private accountKey: string;

  private constructor() {
    this.accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME!;
    this.accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY!;
    
    if (!this.accountName || !this.accountKey) {
      console.warn('Azure Storage credentials not found. Blob operations will be disabled.');
    }
  }

  public static getInstance(): BlobService {
    if (!BlobService.instance) {
      BlobService.instance = new BlobService();
    }
    return BlobService.instance;
  }

  private getBlobServiceClient(): BlobServiceClient {
    if (!this.blobServiceClient) {
      if (!this.accountName || !this.accountKey) {
        throw new Error('Azure Storage credentials not configured');
      }
      
      const sharedKeyCredential = new StorageSharedKeyCredential(this.accountName, this.accountKey);
      this.blobServiceClient = new BlobServiceClient(
        `https://${this.accountName}.blob.core.windows.net`,
        sharedKeyCredential
      );
    }
    return this.blobServiceClient;
  }

  /**
   * Generate a container-level SAS URL for reading blobs under a specific prefix
   */
  public async generateContainerSASUrl(options: ContainerSASOptions): Promise<SASUrlResponse> {
    try {
      const { containerName, permissions = 'r', expiresIn = 30, prefix = 'private/' } = options;

      // Set up SAS options for container-level access
      const sasOptions: BlobSASSignatureValues = {
        containerName,
        permissions: BlobSASPermissions.parse(permissions),
        startsOn: new Date(),
        expiresOn: new Date(Date.now() + expiresIn * 60 * 1000), // Convert minutes to milliseconds
      };

      // Generate SAS token
      const sasToken = generateBlobSASQueryParameters(
        sasOptions,
        new StorageSharedKeyCredential(this.accountName, this.accountKey)
      ).toString();

      // Create the base URL for the container
      const containerUrl = `https://${this.accountName}.blob.core.windows.net/${containerName}`;
      const sasUrl = `${containerUrl}?${sasToken}`;
      const expiresAt = sasOptions.expiresOn!;

      return {
        url: sasUrl,
        expiresAt,
        containerName,
        prefix,
      };
    } catch (error) {
      console.error('Failed to generate container SAS URL:', error);
      throw error;
    }
  }
}

export const blobService = BlobService.getInstance(); 