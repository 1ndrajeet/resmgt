export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface DatabaseError extends Error {
  code?: string;
  errno?: number;
  sqlMessage?: string;
  sqlState?: string;
}

export interface FetchError extends Error {
  status?: number;
  statusText?: string;
  response?: Response;
}

export interface PrismaError extends Error {
  code?: string;
  meta?: Record<string, unknown>;
  clientVersion?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status?: number;
} 