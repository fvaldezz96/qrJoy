import { Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';

import { ok } from '../../core';
import { asyncHandler } from '../../utils/asyncHandler';
import { EntranceTicket } from '../qr/entranceTickets.model';
import { issueQR } from '../qr/qr.service';
import { TICKET_TYPES } from './ticketConfig';

const PurchaseSchema = z.object({
  ticketType: z.enum(['joypark', 'joyweek', 'joybox']),
  quantity: z.number().min(1).max(10),
});

export const purchaseTicket = asyncHandler(async (req: any, res: Response) => {
  const { ticketType, quantity } = PurchaseSchema.parse(req.body);
  // console.log({ ticketType, quantity });
  const userId = req.user?.id || new mongoose.Types.ObjectId('68ead8acd838bbcdef233277');
  // console.log(userId);

  if (!userId) {
    return res.status(401).json({
      ok: false,
      error: { code: 'UNAUTHORIZED', message: 'User must be authenticated' },
    });
  }

  const ticketConfig = TICKET_TYPES[ticketType];
  const totalPrice = ticketConfig.price * quantity;

  // Crear tickets
  const tickets = [];

  for (let i = 0; i < quantity; i++) {
    // Crear QR para el ticket
    const { qr: qrRecord, png: qrImage } = await issueQR('entrance', new mongoose.Types.ObjectId());

    // Crear ticket de entrada
    const ticket = await EntranceTicket.create({
      userId,
      type: ticketType,
      price: ticketConfig.price,
      qrId: qrRecord._id,
      metadata: ticketConfig.metadata,
      validUntil: new Date(Date.now() + ticketConfig.metadata.durationHours * 60 * 60 * 1000),
    });

    tickets.push({
      ticketId: ticket._id,
      type: ticket.type,
      price: ticket.price,
      qrImage,
      qrCode: qrRecord.code,
      validUntil: ticket.validUntil,
    });
  }

  res.json(
    ok({
      purchase: {
        totalPrice,
        quantity,
        tickets,
      },
    }),
  );
});

export const getUserTickets = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user?.id;

  const tickets = await EntranceTicket.find({ userId })
    .populate('qrId', 'code state')
    .sort({ purchaseDate: -1 });

  res.json(ok({ tickets }));
});

// Opcional: Endpoint para ver detalles de un ticket específico
export const getTicketDetails = asyncHandler(async (req: any, res: Response) => {
  const { ticketId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      error: { code: 'UNAUTHORIZED', message: 'User must be authenticated' },
    });
  }

  const ticket = await EntranceTicket.findOne({
    _id: ticketId,
    userId,
  }).populate('qrId', 'code signature state');

  if (!ticket) {
    return res.status(404).json({
      ok: false,
      error: { code: 'TICKET_NOT_FOUND', message: 'Ticket no encontrado' },
    });
  }

  res.json(ok({ ticket }));
});
