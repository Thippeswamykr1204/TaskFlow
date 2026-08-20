import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorResponseBody {
  success: false;
  statusCode: number;
  error: string;
  message: string | string[];
}

/**
 * Tier 0 stub: normalizes every thrown exception into a consistent shape.
 * Real error-code mapping (domain error codes, i18n messages, etc.) lands
 * in Tier 2 — this just guarantees the response envelope exists from day one.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException ? exception.getResponse() : null;

    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (isHttpException && typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const body = exceptionResponse as Record<string, unknown>;
      message = (body.message as string | string[]) ?? exception.message;
      error = (body.error as string) ?? exception.name;
    } else if (isHttpException) {
      message = exception.message;
      error = exception.name;
    }

    const body: ErrorResponseBody = {
      success: false,
      statusCode,
      error,
      message,
    };

    response.status(statusCode).json(body);
  }
}
