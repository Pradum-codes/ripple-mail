export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface ApiSuccessResponse<T> {
  data: T;
}

export interface ApiErrorResponse {
  message?: string;
  error?: string;
  statusCode?: number;
  details?: unknown;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
  raw?: unknown;
}

export interface ApiQueryParams {
  page?: number;
  limit?: number;
  senderId?: number;
  campaignId?: number;
}
