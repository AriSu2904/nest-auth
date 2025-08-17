import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const httpStatusCode = exception.getStatus();

    response.status(httpStatusCode).json({
      statusCode: httpStatusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      message: exception.message || 'Error Occurred',
    });
  }
}
