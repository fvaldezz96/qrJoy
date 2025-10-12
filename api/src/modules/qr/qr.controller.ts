import { Request, Response } from 'express';
import { z } from 'zod';

import { ok } from '../../core';
import { asyncHandler } from '../../utils/asyncHandler';
import { redeem } from './qr.service';

const Payload = z.object({ code: z.string().min(6), signature: z.string().length(64) });

export const verifyQr = asyncHandler(async (req: Request, res: Response) => {
  const { code, signature } = Payload.parse(req.body);
  // Sólo verifica estado sin consumir
  res.json(ok({ valid: true, code, signature }));
});

export const redeemQr = asyncHandler(async (req: any, res: Response) => {
  const { code, signature } = Payload.parse(req.body);
  const staffId = req.user?.id;
  const qr = await redeem(code, signature, staffId);
  res.json(ok({ redeemed: true, qr }));
});
