/** Narrow an unknown thrown value to a log-safe message string. */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}
