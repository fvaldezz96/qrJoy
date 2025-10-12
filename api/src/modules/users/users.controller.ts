import { Request, Response } from 'express';

import { ok } from '../../core';
import { asyncHandler } from '../../utils/asyncHandler';
import { User } from './user.model';

export const me = asyncHandler(async (req: any, res: Response) => {
  const user = await User.findById(req.user.id).select('_id email role').lean();
  res.json(ok(user));
});

export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await User.find();
  res.json(ok(users));
});
