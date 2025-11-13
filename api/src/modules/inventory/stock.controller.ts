import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';

import { ok } from '../../core/http';
import { asyncHandler } from '../../utils/asyncHandler';
import { Stock } from './stock.model';
import { ensureStockForProduct } from './stock.service';

const AdjustDto = z.object({
  location: z.enum(['bar', 'restaurant', 'door']),
  delta: z.number().int(),
  // opcional: forzar set absoluto
  set: z.number().int().optional(),
});

const InitDto = z.object({
  productId: z.string().min(1),
  initial: z
    .object({
      bar: z.number().nonnegative().optional(),
      restaurant: z.number().nonnegative().optional(),
      door: z.number().nonnegative().optional(),
    })
    .optional(),
});

// GET /stock
export const listStock = asyncHandler(async (_req: Request, res: Response) => {
  const items = await Stock.find({}).populate('productId', 'name category sku price active').lean();
  res.json(ok(items));
});

// PATCH /stock/:productId
export const adjustStock = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { location, delta, set } = AdjustDto.parse(req.body);

  const doc = await Stock.findOne({ productId, location });

  if (!doc) {
    // crea doc si no existe (lazy)
    const created = await Stock.create({
      productId: new Types.ObjectId(productId),
      location,
      quantity: set ?? Math.max(0, delta),
    });
    return res.json(ok(created));
  }

  if (typeof set === 'number') {
    doc.quantity = Math.max(0, set);
  } else {
    doc.quantity = Math.max(0, (doc.quantity || 0) + delta);
  }

  await doc.save();
  res.json(ok(doc));
});

// POST /stock/init
export const initStock = asyncHandler(async (req: Request, res: Response) => {
  const { productId, initial } = InitDto.parse(req.body);
  await ensureStockForProduct(new Types.ObjectId(productId), initial);
  const items = await Stock.find({ productId }).lean();
  res.json(ok(items));
});
