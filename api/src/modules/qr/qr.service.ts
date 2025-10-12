import crypto from 'crypto';
import { ClientSession, Types } from 'mongoose';
import QRCode from 'qrcode';

import { Order } from '../orders/order.model';
import { Ticket } from '../tickets/tickets.model';
import { EntranceTicket } from './entranceTickets.model';
import { QR } from './qr.model';

// ACTUALIZAR: Incluir 'entrance' en QRKind
export type QRKind = 'order' | 'ticket' | 'entrance';

const ttlMinutes = Number(process.env.QR_TTL_MINUTES || 240);
const secret = process.env.APP_SECRET || 'fallback-secret-for-development';

function hmac(code: string) {
  return crypto.createHmac('sha256', secret).update(code).digest('hex');
}

export async function issueQR(
  kind: QRKind,
  refId: Types.ObjectId | string,
  session?: ClientSession,
) {
  // Validaciones críticas
  if (!refId) {
    throw new Error('refId is required for QR generation');
  }

  const code = Math.random().toString(36).slice(2, 14);
  const signature = hmac(code);

  const expiresAt = ttlMinutes ? new Date(Date.now() + ttlMinutes * 60 * 1000) : undefined;
  const qr = await QR.create(
    [{ kind, refId, code, signature, state: 'active', createdAt: new Date(), expiresAt }],
    { session },
  ).then(r => r[0]);

  const payload = JSON.stringify({ c: code, s: signature });
  const png = await QRCode.toDataURL(payload);

  return { qr, png };
}

export async function redeem(code: string, signature: string, staffId: Types.ObjectId) {
  const qr = await QR.findOneAndUpdate(
    {
      code,
      signature,
      state: 'active',
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
    },
    { $set: { state: 'redeemed', redeemedAt: new Date(), redeemedBy: staffId } },
    { new: true },
  );

  if (!qr) throw new Error('INVALID_OR_USED');

  if (qr.kind === 'order') {
    await Order.updateOne({ _id: qr.refId }, { $set: { status: 'served' } });
  }

  if (qr.kind === 'ticket') {
    await Ticket.updateOne({ _id: qr.refId }, { $set: { status: 'redeemed' } });
  }

  // NUEVO: Manejar entradas
  if (qr.kind === 'entrance') {
    const entranceTicket = await EntranceTicket.findOne({ qrId: qr._id });
    if (entranceTicket && entranceTicket.status === 'active') {
      entranceTicket.status = 'used';
      entranceTicket.usedAt = new Date();
      entranceTicket.usedBy = staffId;
      await entranceTicket.save();
    } else {
      throw new Error('TICKET_ALREADY_USED_OR_INVALID');
    }
  }

  return qr;
}
