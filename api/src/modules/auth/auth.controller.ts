import { Request, Response } from 'express';
import { z } from 'zod';

import { fail, ok } from '../../core/http';
import { asyncHandler } from '../../utils/asyncHandler';
import { User } from '../users/user.model';
import { createUser, loginUser } from './auth.service';

const RegisterDto = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['user', 'admin', 'employee']).optional(),
  name: z.string().min(1).optional(),
});

const LoginDto = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const dto = RegisterDto.parse(req.body);
  const { user, token } = await createUser(dto);
  res.json(ok({ user, token }));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const dto = LoginDto.parse(req.body);
  const { user, token } = await loginUser(dto);
  res.json(ok({ user, token }));
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  // requireAuth adjunta req.user
  if (!req.user) return res.status(401).json(fail('UNAUTHORIZED', 'UNAUTHORIZED'));
  res.json(ok(req.user));
});

export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  const items = await User.find({}, { passwordHash: 0 }).lean();
  res.json(ok(items));
});
