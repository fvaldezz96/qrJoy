import { Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';

import { ok } from '../../core';
import { AuthedRequest } from '../../middlewares/requireAuth';
import { asyncHandler } from '../../utils/asyncHandler';
import { Stock, StockLocation } from '../inventory/stock.model';
import { IOrder, Order } from '../orders/order.model';
import { Product } from '../products/product.model';
import { issueQR } from '../qr/qr.service';
import { Table } from '../tables/table.model';
import { Ticket } from './tickets.model';

const CreateTicketDto = z.object({ eventDate: z.coerce.date(), price: z.number().nonnegative() });

export const createTicket = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { eventDate, price } = CreateTicketDto.parse(req.body);
  const ticket = await Ticket.create({
    userId: req.user!._id,
    eventDate,
    price,
    status: 'issued',
  });
  res.json(ok(ticket));
});

export const payMockTicket = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const id = req.params.id;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const t = await Ticket.findById(id).session(session);
    if (!t) throw new Error('TICKET_NOT_FOUND');
    if (t.status !== 'issued') throw new Error('INVALID_STATUS');
    t.status = 'paid';
    await t.save({ session });

    const { png, qr } = await issueQR('ticket', t._id, session);
    t.qrId = qr._id;
    await t.save({ session });

    await session.commitTransaction();
    res.json(ok({ ticketId: t._id, pngDataUrl: png, code: qr.code, signature: qr.signature }));
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
});

export const myTickets = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const items = await Ticket.find({ userId: req.user!._id }).sort({ createdAt: -1 }).lean();
  res.json(ok(items));
});

export const closeOrderAndEmitReceipt = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userIdClose = req.body;

  try {
    const order = await Order.findById<IOrder>(id);
    if (!order) throw new Error('ORDER_NOT_FOUND');

    // 1) Descuento stock
    for (const item of order.items) {
      const stock = await Stock.findOne({
        productId: item.productId,
        location: order.type as StockLocation,
      });

      if (!stock) {
        throw new Error(`STOCK_NOT_FOUND para producto ${item.productId} en ${order.type}`);
      }

      if (stock.quantity < item.qty) {
        throw new Error(`INSUFFICIENT_STOCK para ${item.productId}`);
      }

      stock.quantity -= item.qty;
      await stock.save();
    }

    // 2) Marcar pagada
    order.status = 'paid';
    await order.save();

    const { png: orderPng, qr: orderQR } = await issueQR('order', order._id);

    order.qrId = orderQR._id;
    await order.save();

    const productIds = order.items.map((i: any) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }, { _id: 1, name: 1 }).lean();

    const byId = new Map(products.map(p => [String(p._id), p.name]));

    const itemsSnapshot = order.items.map((it: any) => ({
      productId: it.productId,
      name: byId.get(String(it.productId)) || 'Producto',
      qty: it.qty,
      price: it.price,
      subtotal: it.qty * it.price,
    }));

    const tableNumber = order.tableId
      ? (await Table.findById(order.tableId, { number: 1 }).lean())?.number
      : undefined;

    const receipt = await Ticket.create({
      userId:
        order.userId || new mongoose.Types.ObjectId('68ead87ed838bbcdef233271') || userIdClose,
      orderId: order._id,
      price: order.total,
      status: 'paid',
      qrCode: orderQR.code,
      redeemed: false,
      qrId: orderQR._id,
      tableId: order.tableId,
      tableNumber,
      items: itemsSnapshot,
      total: order.total,
    });

    return res.json({
      ok: true,
      data: {
        orderId: order._id,
        orderStatus: order.status,
        orderQR: {
          pngDataUrl: orderPng,
          code: orderQR.code,
          signature: orderQR.signature,
        },
        receipt: {
          ticketId: receipt._id,
          tableNumber: receipt.tableNumber,
          total: receipt.total,
          items: receipt.items,
          qrLinkedToOrder: true,
        },
      },
    });
  } catch (e: any) {
    console.error('❌ Full error in closeOrder:', e);
    return res.status(400).json({
      ok: false,
      error: {
        code: e.code || 'UNKNOWN',
        message: e.message,
      },
    });
  }
});
