import { NextResponse } from 'next/server';
import { ApiError, DatabaseError } from './types';

export function handleApiError(error: unknown) {
  const dbError = error as DatabaseError;
  const apiError: ApiError = {
    message: dbError.message || 'Internal server error',
    code: dbError.code,
    status: 500
  };
  
  return NextResponse.json({ error: apiError }, { status: apiError.status });
} 