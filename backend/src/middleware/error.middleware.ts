import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorMiddleware(err: Error, req: Request, res: Response, next: NextFunction): void {
  logger.error('API Error', err);

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 500,
  });
}
