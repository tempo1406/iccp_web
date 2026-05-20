export interface IngestJobResponse {
  job_id: string;
  document_id: string;
  organization_id: string;
  status: 'pending' | 'processing' | 'indexed' | 'failed' | 'policy_rejected';
  message: string;
}

export interface IngestJobStatusResponse {
  job_id: string;
  document_id: string;
  organization_id: string;
  status: string;
  chunks_count?: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface AiApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}
