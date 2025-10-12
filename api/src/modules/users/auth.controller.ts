import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { ok } from '../../core';
import { asyncHandler } from '../../utils/asyncHandler';
import { User } from './user.model';

const RegisterDto = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['user', 'admin', 'employee']).optional().default('user'),
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, role } = RegisterDto.parse(req.body);
  const exists = await User.findOne({ email });
  if (exists)
    return res
      .status(400)
      .json({ ok: false, error: { code: 'EMAIL_TAKEN', message: 'Email ya registrado' } });
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hash, role });
  res.json(ok({ id: user._id, email: user.email }));
});

const LoginDto = z.object({ email: z.string().email(), password: z.string().min(1) });
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = LoginDto.parse(req.body);
  const user = await User.findOne({ email }).lean();
  if (!user)
    return res.status(401).json({
      ok: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas' },
    });
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match)
    return res.status(401).json({
      ok: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas' },
    });
  const token = jwt.sign({ role: user.role }, process.env.JWT_SECRET!, {
    subject: String(user._id),
    expiresIn: '7d',
  });
  res.json(ok({ token, role: user.role }));
});
