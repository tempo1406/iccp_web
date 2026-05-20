import { AiBaseService } from '../base-ai.service';
import type {
  AiApiResponse,
  IngestJobResponse,
  IngestJobStatusResponse,
} from './types/ingest.types';

export class IngestAiService extends AiBaseService {
  async triggerIngest(documentId: string): Promise<IngestJobResponse> {
    const res = await this.post<AiApiResponse<IngestJobResponse>>(
      '/api/v1/ingest/documents/trigger',
      { document_id: documentId },
    );
    return res.data;
  }

  async getIngestJobStatus(jobId: string): Promise<IngestJobStatusResponse> {
    const res = await this.get<AiApiResponse<IngestJobStatusResponse>>(
      `/api/v1/ingest/jobs/${jobId}`,
    );
    return res.data;
  }
}
