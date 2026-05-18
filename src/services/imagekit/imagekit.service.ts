import { BaseService } from '@/services/base-service';

export interface ImageKitUploadResponse {
  url: string;
  fileId: string;
  name: string;
}

export interface ImageKitFileItem {
  url: string;
  fileId: string;
  name: string;
  fileType: 'image' | 'non-image';
  mime: string;
}

export class ImageKitService extends BaseService {
  private readonly base = '/v1/imagekit';

  /**
   * upload — POST /api/v1/imagekit/upload
   * Uploads a file to ImageKit. Optionally specify a folder.
   */
  upload(file: File, folder?: string): Promise<ImageKitUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (folder?.trim()) {
      formData.append('folder', folder.trim());
    }
    return this.post<ImageKitUploadResponse, FormData>(`${this.base}/upload`, formData);
  }

  /**
   * listFiles — GET /api/v1/imagekit/list?path=…
   * Lists all files under a given folder path in ImageKit.
   */
  listFiles(path: string): Promise<ImageKitFileItem[]> {
    return this.get<ImageKitFileItem[]>(`${this.base}/list?path=${encodeURIComponent(path)}`);
  }

  /**
   * deleteFile — DELETE /v1/imagekit
   * Deletes a file from ImageKit by URL.
   */
  deleteFile(url: string): Promise<void> {
    return this.call<void, { url: string }>(this.base, {
      method: 'DELETE',
      body: { url },
    });
  }
}
