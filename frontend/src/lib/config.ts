/** Centralized configuration values to avoid duplication across the codebase. */

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3001";

// Phase 4: 'poll' (default, 2s polling) | 'sse' (push via EventSource, with
// automatic poll fallback on any SSE error). Default preserves today.
export const STATUS_TRANSPORT =
  process.env.NEXT_PUBLIC_STATUS_TRANSPORT === "sse" ? "sse" : "poll";
