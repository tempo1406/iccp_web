export type EntityId = string;

export interface ApiPaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ApiListResponse<TItem> {
  items: TItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponseDto<T = unknown> {
  statusCode: number;
  message: string;
  data: T;
  warnings?: string[];
}

export interface ApiValidationErrorDetail {
  property: string;
  code: string;
  message: string;
}

export interface ApiErrorDto {
  timestamp: string;
  statusCode: number;
  error: string;
  errorCode?: string;
  message: string;
  details?: ApiValidationErrorDetail[];
}
