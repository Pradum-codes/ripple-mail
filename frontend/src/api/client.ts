import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiError, ApiErrorResponse } from '@/types/api';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error('VITE_API_BASE_URL is not configured.');
}

type AuthTokenResolver = () => string | null;
type ServiceUnavailableHandler = () => void;

let authTokenResolver: AuthTokenResolver | null = null;
let serviceUnavailableHandler: ServiceUnavailableHandler | null = null;

export function setAuthTokenResolver(resolver: AuthTokenResolver | null) {
  authTokenResolver = resolver;
}

export function setServiceUnavailableHandler(handler: ServiceUnavailableHandler | null) {
  serviceUnavailableHandler = handler;
}

function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    return normalizeAxiosError(error);
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      raw: error,
    };
  }

  return {
    message: 'An unexpected error occurred.',
    raw: error,
  };
}

function normalizeAxiosError(error: AxiosError<ApiErrorResponse>): ApiError {
  const responseData = error.response?.data;
  const message =
    responseData?.message ??
    responseData?.error ??
    error.message ??
    'Request failed.';

  return {
    message,
    status: error.response?.status,
    code: error.code,
    details: responseData?.details,
    raw: error,
  };
}

function addAuthHeader(config: InternalAxiosRequestConfig) {
  const token = authTokenResolver?.();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => addAuthHeader(config),
  (error) => Promise.reject(normalizeApiError(error)),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalizedError = normalizeApiError(error);

    if (normalizedError.status === 503) {
      serviceUnavailableHandler?.();
    }

    return Promise.reject(normalizedError);
  },
);

export { normalizeApiError };
