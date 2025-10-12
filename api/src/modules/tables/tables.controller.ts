import { Request, Response } from 'express';
import { z } from 'zod';

import { ok } from '../../core/http';
import { asyncHandler } from '../../utils/asyncHandler';
import { Table } from './table.model';

const UpsertTable = z.object({
  name: z.string().min(1),
  capacity: z.number().int().positive(),
  active: z.boolean().default(true),
});

// 🔹 Listar mesas
export const listTables = asyncHandler(async (_req: Request, res: Response) => {
  const items = await Table.find({}).lean();
  res.json(ok(items));
});

// 🔹 Crear mesa
export const createTable = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  // console.log(data);
  try {
    const doc = await Table.create(data);
    if (!doc) throw new Error('TABLE_NOT_CREATED');
    res.json(ok(doc));
  } catch (error) {
    console.log(error);
    res
      .status(400)
      .json({ error: 'Error al crear la mesa. Verifica los datos e intenta nuevamente.' });
  }
});

// 🔹 Actualizar mesa
export const updateTable = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = UpsertTable.partial().parse(req.body);

  const updated = await Table.findByIdAndUpdate(id, data, { new: true });
  if (!updated) return res.status(404).json({ error: 'Mesa no encontrada' });

  res.json(ok(updated));
});

// 🔹 Eliminar (o desactivar) mesa
export const deleteTable = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const deleted = await Table.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: 'Mesa no encontrada' });

  res.json(ok({ message: 'Mesa eliminada correctamente', id }));
});
