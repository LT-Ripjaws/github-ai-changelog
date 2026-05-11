import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpException');

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const status = exception.getStatus();
    const body = exception.getResponse();

    const message = typeof body === 'string' ? body : (body as any).message;
    this.logger.error(`${status} - ${JSON.stringify(message)}`);

    res.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}

/** Catches all unhandled exceptions (non-HttpException) and returns a
 *  sanitized 500 response — no stack traces, no internal details leaked. */
@Catch()
export class GenericExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();

    this.logger.error(`Unhandled: ${exception.message}`, exception.stack);

    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}
