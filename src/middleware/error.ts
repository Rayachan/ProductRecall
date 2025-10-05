import createHttpError from 'http-errors';
import { NextFunction, Request, Response } from 'express';

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(createHttpError(404, 'Route not found'));
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status || 500;
  const payload: any = {
    message: err.message || 'Internal Server Error',
  };
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    payload.stack = err.stack;
  }
  res.status(status).json(payload);
}
