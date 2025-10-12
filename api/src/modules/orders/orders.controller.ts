import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';

import { ok } from '../../core';
import { AuthedRequest } from '../../middlewares/requireAuth';
import { asyncHandler } from '../../utils/asyncHandler';
import { Stock } from '../inventory/stock.model';
import { issueQR } from '../qr/qr.service';
import { Order } from './order.model';

const CreateOrderDto = z.object({
  type: z.enum(['bar', 'restaurant']),
  tableId: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        qty: z.number().int().positive(),
        price: z.number().nonnegative(),
        note: z.string().optional(),
      }),
    )
    .min(1),
});

export const createOrder = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { type, tableId, items } = CreateOrderDto.parse(req.body);

  const invalidItems = items.filter(item => !mongoose.Types.ObjectId.isValid(item.productId));
  if (invalidItems.length > 0) {
    throw new Error('Algunos productId no son válidos');
  }

  const total = items.reduce((a, b) => a + b.qty * b.price, 0);

  const order = await Order.create({
    userId: req.user?._id,
    type,
    tableId: tableId || undefined,
    items: items.map(item => ({
      productId: new mongoose.Types.ObjectId(item.productId),
      qty: item.qty,
      price: item.price,
      note: item.note || undefined,
    })),
    total,
    status: 'pending',
  });

  // Populate para obtener datos del producto
  await order.populate('items.productId', 'name description');

  res.json(ok(order));
});

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const { status, type, tableId } = req.query as any;
  const q: any = {};
  if (status) q.status = status;
  if (type) q.type = type;
  if (tableId) q.tableId = tableId;
  const items = await Order.find(q).sort({ createdAt: -1 }).lean();
  res.json(ok(items));
});

// Pago Mock: descuenta stock + emite QR
export const payMockOrder = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const id = req.params.id;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = await Order.findById(id).session(session);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (order.status !== 'pending') throw new Error('INVALID_STATUS');

    // Descontar stock
    for (const it of order.items) {
      const st = await Stock.findOne({ productId: it.productId }).session(session);
      if (!st || st.quantity < it.qty) throw new Error('INSUFFICIENT_STOCK');
      st.quantity -= it.qty;
      await st.save({ session });
    }

    order.status = 'paid';
    await order.save({ session });

    const { png, qr } = await issueQR('order', order._id, session);
    order.qrId = qr._id;
    await order.save({ session });

    await session.commitTransaction();
    res.json(ok({ orderId: order._id, pngDataUrl: png, code: qr.code, signature: qr.signature }));
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: string };
  const allowed = ['pending', 'paid', 'ready', 'served', 'cancelled'];
  if (!allowed.includes(status))
    return res
      .status(400)
      .json({ ok: false, error: { code: 'INVALID_STATUS', message: 'Estado inválido' } });
  const doc = await Order.findByIdAndUpdate(id, { status }, { new: true });
  res.json(ok(doc));
});
