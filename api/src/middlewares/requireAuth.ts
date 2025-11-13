import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { fail } from '../core/http';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export type AuthedUser = {
  _id: string;
  role: 'user' | 'admin' | 'employee';
  email: string;
};

export interface AuthedRequest extends Request {
  user?: AuthedUser;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json(fail('UNAUTHORIZED', 'UNAUTHORIZED'));

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthedUser;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json(fail('INVALID_TOKEN', 'UNAUTHORIZED'));
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json(fail('UNAUTHORIZED', 'UNAUTHORIZED'));
  if (req.user.role !== 'admin') return res.status(403).json(fail('FORBIDDEN', 'FORBIDDEN'));
  next();
}
