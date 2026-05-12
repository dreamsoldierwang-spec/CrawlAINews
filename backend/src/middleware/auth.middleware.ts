import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';

export interface AuthRequest extends Request {
  userId?: number;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const user = await userService.getById(parseInt(token, 10));

    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid token' });
      return;
    }

    req.userId = user.id;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
}
