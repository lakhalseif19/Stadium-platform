import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode } from '../enums';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = ErrorCode.INTERNAL_ERROR;
    let message = 'An unexpected error occurred';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        code = (resp['code'] as ErrorCode) || this.mapStatusToCode(statusCode);
        message = (resp['message'] as string) || exception.message;

        // Handle class-validator errors
        if (Array.isArray(resp['message'])) {
          message = (resp['message'] as string[]).join('; ');
          code = ErrorCode.VALIDATION_ERROR;
        }
      } else {
        message = exceptionResponse as string;
        code = this.mapStatusToCode(statusCode);
      }
    }

    // Log errors (never log sensitive data)
    if (statusCode >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} - ${statusCode} - ${code}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`[${request.method}] ${request.url} - ${statusCode} - ${code} - ${message}`);
    }

    response.status(statusCode).json({
      statusCode,
      code,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private mapStatusToCode(status: number): ErrorCode {
    switch (status) {
      case 400:
        return ErrorCode.VALIDATION_ERROR;
      case 401:
        return ErrorCode.INVALID_CREDENTIALS;
      case 403:
        return ErrorCode.FORBIDDEN;
      case 404:
        return ErrorCode.NOT_FOUND;
      case 429:
        return ErrorCode.RATE_LIMIT_EXCEEDED;
      default:
        return ErrorCode.INTERNAL_ERROR;
    }
  }
}
