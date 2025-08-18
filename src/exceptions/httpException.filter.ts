import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const httpStatusCode = exception.getStatus();

    response.status(httpStatusCode).json({
      timestamp: new Date().toISOString(),
      message: exception.message || 'Error Occurred',
    });
  }
}
