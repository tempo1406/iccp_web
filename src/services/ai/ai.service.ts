import { IngestAiService } from './ingest/ingest-ai.service';

export type {
  AiApiResponse,
  IngestJobResponse,
  IngestJobStatusResponse,
} from './ingest/types/ingest.types';

/**
 * Backward-compatible alias.
 *
 * Prefer importing IngestAiService from:
 * - src/services/ai/modules/ingest/ingest-ai.service
 */
export class AiService extends IngestAiService {}
