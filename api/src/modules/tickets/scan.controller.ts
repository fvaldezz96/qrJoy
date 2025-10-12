import { Request, Response } from 'express';
import { z } from 'zod';

import { ok } from '../../core';
import { asyncHandler } from '../../utils/asyncHandler';
import { EntranceTicket } from '../qr/entranceTickets.model';
import { QR } from '../qr/qr.model';
import { redeem } from '../qr/qr.service';

const ScanSchema = z.object({
  code: z.string().min(6),
  signature: z.string().length(64),
});

export const scanEntranceQR = asyncHandler(async (req: any, res: Response) => {
  const { code, signature } = ScanSchema.parse(req.body);
  const staffId = req.user?.id;

  if (!staffId) {
    return res.status(401).json({
      ok: false,
      error: { code: 'UNAUTHORIZED', message: 'Staff authentication required' },
    });
  }

  try {
    const qr = await redeem(code, signature, staffId);

    const ticket = await EntranceTicket.findOne({ qrId: qr._id })
      .populate('userId', 'name email')
      .populate('usedBy', 'name');

    if (!ticket) {
      return res.status(404).json({
        ok: false,
        error: { code: 'TICKET_NOT_FOUND', message: 'No se encontró el ticket asociado' },
      });
    }

    res.json(
      ok({
        success: true,
        ticket: {
          id: ticket._id,
          type: ticket.type,
          status: ticket.status,
          price: ticket.price,
          purchaseDate: ticket.purchaseDate,
          validUntil: ticket.validUntil,
          userName: ticket.userId?.name,
          userEmail: ticket.userId?.email,
          usedAt: ticket.usedAt,
          usedBy: ticket.usedBy?.name,
          metadata: ticket.metadata,
        },
        message: 'Entrada validada exitosamente',
      }),
    );
  } catch (error: any) {
    if (error.message === 'INVALID_OR_USED') {
      return res.status(400).json({
        ok: false,
        error: { code: 'QR_INVALID', message: 'QR inválido o ya utilizado' },
      });
    }
    if (error.message === 'TICKET_ALREADY_USED_OR_INVALID') {
      return res.status(400).json({
        ok: false,
        error: { code: 'TICKET_USED', message: 'Esta entrada ya fue utilizada' },
      });
    }

    console.error('Scan error:', error);
    return res.status(500).json({
      ok: false,
      error: { code: 'SCAN_ERROR', message: 'Error al escanear el código QR' },
    });
  }
});

export const getQRInfo = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params;

  const qr = await QR.findOne({ code }).populate('redeemedBy', 'name email');

  if (!qr) {
    return res.status(404).json({
      ok: false,
      error: { code: 'QR_NOT_FOUND', message: 'Código QR no encontrado' },
    });
  }

  let ticketInfo = null;
  if (qr.kind === 'entrance') {
    ticketInfo = await EntranceTicket.findOne({ qrId: qr._id })
      .populate('userId', 'name email')
      .populate('usedBy', 'name');
  }

  let orderInfo = null;
  if (qr.kind === 'order') {
    const { Order } = await import('../orders/order.model.js');
    orderInfo = await Order.findOne({ _id: qr.refId }).populate('userId', 'name email');
  }

  let regularTicketInfo = null;
  if (qr.kind === 'ticket') {
    const { Ticket } = await import('./tickets.model.js');
    regularTicketInfo = await Ticket.findOne({ _id: qr.refId }).populate('userId', 'name email');
  }

  res.json(
    ok({
      qr: {
        code: qr.code,
        kind: qr.kind,
        state: qr.state,
        createdAt: qr.createdAt,
        expiresAt: qr.expiresAt,
        redeemedAt: qr.redeemedAt,
        redeemedBy: qr.redeemedBy,
      },
      ticket: ticketInfo,
      order: orderInfo,
      regularTicket: regularTicketInfo,
    }),
  );
});

export const getScanStats = asyncHandler(async (req: any, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayScans = await EntranceTicket.countDocuments({
    usedAt: {
      $gte: today,
      $lt: tomorrow,
    },
  });

  const totalTickets = await EntranceTicket.countDocuments();

  const usedTickets = await EntranceTicket.countDocuments({ status: 'used' });

  const activeTickets = await EntranceTicket.countDocuments({ status: 'active' });

  const ticketsByType = await EntranceTicket.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        used: {
          $sum: { $cond: [{ $eq: ['$status', 'used'] }, 1, 0] },
        },
      },
    },
  ]);

  res.json(
    ok({
      stats: {
        todayScans,
        totalTickets,
        usedTickets,
        activeTickets,
        ticketsByType,
      },
    }),
  );
});

export const getRecentScans = asyncHandler(async (req: any, res: Response) => {
  const { limit = 20 } = req.query;

  const recentScans = await EntranceTicket.find({ status: 'used' })
    .populate('userId', 'name email')
    .populate('usedBy', 'name')
    .sort({ usedAt: -1 })
    .limit(Number(limit));

  res.json(
    ok({
      recentScans: recentScans.map(scan => ({
        ticketId: scan._id,
        type: scan.type,
        userName: scan.userId?.name,
        userEmail: scan.userId?.email,
        usedAt: scan.usedAt,
        usedBy: scan.usedBy?.name,
        price: scan.price,
      })),
    }),
  );
});
