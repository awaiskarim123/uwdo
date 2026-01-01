

import { NextResponse } from 'next/server';


export function successResponse<T>(
  data: T,
  message: string = 'Success',
  status: number = 200
) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}


export function errorResponse(
  message: string,
  status: number = 400,
  errors?: Record<string, string[]>
) {
  return NextResponse.json(
    {
      success: false,
      message,
      ...(errors && { errors }),
    },
    { status }
  );
}

/**
 * Validation error response helper
 */
export function validationErrorResponse(errors: Record<string, string[]>) {
  return errorResponse('Validation failed', 400, errors);
}


