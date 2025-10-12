import { Request, Response } from 'express';
import { z } from 'zod';

import { ok } from '../../core';
import { asyncHandler } from '../../utils/asyncHandler';
import { Comanda } from './comanda.model';

const CreateComandaDto = z.object({
  orderId: z.string(),
  station: z.enum(['bar', 'kitchen']),
  items: z.array(
    z.object({
      productId: z.string(),
      qty: z.number().int().positive(),
      price: z.number().nonnegative(),
      note: z.string().optional(),
    }),
  ),
});

export const createComanda = asyncHandler(async (req: Request, res: Response) => {
  const body = CreateComandaDto.parse(req.body);
  try {
    const doc = await Comanda.create({ ...body, status: 'queued' });
    res.status(200).json(ok(doc));
  } catch (error) {
    console.log(error);
    res
      .status(400)
      .json({ error: 'Error al crear la comanda. Verifica los datos e intenta nuevamente.' });
  }
});

export const listComandas = asyncHandler(async (req: Request, res: Response) => {
  const { station, status } = req.query as any;
  const q: any = {};
  if (station) q.station = station;
  if (status) q.status = status;
  const items = await Comanda.find(q).sort({ createdAt: 1 }).lean();
  res.json(ok(items));
});

const UpdateStatusDto = z.object({
  status: z.enum(['queued', 'in_progress', 'served', 'cancelled']),
});

export const updateComanda = asyncHandler(async (req: Request, res: Response) => {
  const { status } = UpdateStatusDto.parse(req.body);
  const doc = await Comanda.findByIdAndUpdate(req.params.id, { status }, { new: true });
  res.json(ok(doc));
});
