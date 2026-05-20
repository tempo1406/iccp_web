import type { ApiErrorDto } from '@/common/types/api';

export class HttpError extends Error {
  status: number;
  payload?: ApiErrorDto;

  constructor(status: number, payload?: ApiErrorDto) {
    super(payload?.message ?? `HTTP request failed with status ${status}`);
    this.name = 'HttpError';
    this.status = status;
    this.payload = payload;
  }
}
