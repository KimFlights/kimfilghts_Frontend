/**
 * Centralized API client for the KimFlights backend.
 *
 * - Reads the base URL from VITE_API_BASE_URL (.env)
 * - Automatically attaches Authorization: Bearer <token> if a token is stored
 * - Throws a typed ApiError on non-2xx responses so callers can handle them
 */

import { getAuthSnapshot } from "@/lib/auth";

const BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "http://localhost:8080";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAuthSnapshot().token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, body || `HTTP ${res.status}`);
  }

  // 204 No Content or empty body — return void cast
  const text = await res.text();
  if (!text) return undefined as unknown as T;
  return JSON.parse(text) as T;
}
