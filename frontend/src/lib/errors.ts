/** Extract a user-friendly error message from thrown objects. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
}

/** Sanitize backend error messages before rendering in the UI.
 * Strips file paths, stack traces, SQL fragments, and internal identifiers. */
export function safeErrorMessage(raw: string | null | undefined): string {
  if (!raw) return '';
  const sanitized = raw
    .replace(/(at\s+\S+.*$|^\s*at\s+.+)/gm, '')
    .replace(/[\\/][\w./\\]{3,}/g, '[redacted]')
    .replace(/(error|exception|query)[^a-zA-Z]{0,20}[\w./\\]{5,}/gi, '$1')
    .trim()
    .slice(0, 500);
  return sanitized || 'Sync failed — check the dashboard console.';
}
