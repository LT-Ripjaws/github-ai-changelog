import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';

interface HttpErrorBody {
  message?: string | string[];
}

function getExceptionMessage(body: string | object): string | string[] | undefined {
  return typeof body === 'string' ? body : (body as HttpErrorBody).message;
}

/**
 * Single global filter. A catch-all `@Catch()` would shadow a separate
 * `@Catch(HttpException)` filter depending on registration order, so both
 * concerns live here and branch explicitly — no ordering dependency.
 *
 * - HttpException  → preserve status + message
 * - anything else  → log server-side, return sanitized 500 (no stack leak)
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly httpLogger = new Logger('HttpException');
  private readonly errorLogger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const message = getExceptionMessage(exception.getResponse());
      this.httpLogger.error(`${status} - ${JSON.stringify(message)}`);
      res.status(status).json({
        statusCode: status,
        message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const message = exception instanceof Error ? exception.message : 'Unknown error';
    const stack = exception instanceof Error ? exception.stack : undefined;
    this.errorLogger.error(`Unhandled: ${message}`, stack);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}
