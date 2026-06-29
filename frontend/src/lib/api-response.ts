import { NextResponse } from "next/server";
import type { ErrorResponse } from "@/types/api";

/**
 * Standardized error response handler for API routes
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: unknown,
): NextResponse<ErrorResponse> {
  // Log error details for debugging
  if (process.env.NODE_ENV === "development") {
    console.error(`[${status}] ${message}`, details);
  }

  return NextResponse.json(
    {
      error: message,
      status,
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

/**
 * Safe JSON response wrapper
 */
export function jsonResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Success response wrapper
 */
export function successResponse<T>(data: T, message?: string) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status: 200 },
  );
}
