import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './enums';

export class BusinessException extends HttpException {
  public readonly code: ErrorCode;

  constructor(
    codeOrMessage: ErrorCode | string,
    message?: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    const isCode = Object.values(ErrorCode).includes(codeOrMessage as ErrorCode);
    const code = isCode ? (codeOrMessage as ErrorCode) : ErrorCode.VALIDATION_ERROR;
    const msg = isCode ? message || 'Business error' : (codeOrMessage as string);
    super(
      {
        statusCode,
        code,
        message: msg,
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
    this.code = code;
  }
}

export class BadRequestException extends BusinessException {
  constructor(codeOrMessage: ErrorCode | string = ErrorCode.VALIDATION_ERROR, message?: string) {
    super(codeOrMessage, message, HttpStatus.BAD_REQUEST);
  }
}

export class ConflictException extends BusinessException {
  constructor(
    codeOrMessage: ErrorCode | string = ErrorCode.RESERVATION_CONFLICT,
    message?: string,
  ) {
    super(codeOrMessage, message, HttpStatus.CONFLICT);
  }
}

export class NotFoundException extends BusinessException {
  constructor(codeOrMessage: ErrorCode | string = ErrorCode.NOT_FOUND, message?: string) {
    super(codeOrMessage, message, HttpStatus.NOT_FOUND);
  }
}

export class ForbiddenException extends BusinessException {
  constructor(message = 'Access denied') {
    super(ErrorCode.FORBIDDEN, message, HttpStatus.FORBIDDEN);
  }
}

export class UnauthorizedException extends BusinessException {
  constructor(codeOrMessage: ErrorCode | string = ErrorCode.INVALID_CREDENTIALS, message?: string) {
    super(codeOrMessage, message, HttpStatus.UNAUTHORIZED);
  }
}

export class TooManyRequestsException extends BusinessException {
  constructor(message = 'Too many requests') {
    super(ErrorCode.RATE_LIMIT_EXCEEDED, message, HttpStatus.TOO_MANY_REQUESTS);
  }
}
