import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = exception instanceof HttpException ? exception.getResponse() : undefined;
    const message = typeof payload === 'object' && payload && 'message' in payload ? (payload as { message: string | string[] }).message : status === 500 ? 'An unexpected error occurred.' : String(payload);
    response.status(status).json({ success: false, error: { code: status === 409 ? 'TRIP_CAPACITY_EXCEEDED' : `HTTP_${status}`, message, details: Array.isArray(message) ? message : [] } });
  }
}
