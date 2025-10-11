// export async function issueQR(kind: QRKind, refId: ObjectId) {
// const code = randomBase36(12);
// const signature = hmac(code, process.env.APP_SECRET!);
// const qr = await QrModel.create({ kind, refId, code, signature, state:'active', createdAt:new Date(), expiresAt:addMinutes(new Date(), +process.env.QR_TTL_MINUTES!) });
// const payload = JSON.stringify({ c: code, s: signature });
// const png = await QRCode.toDataURL(payload); // qrcode lib
// return { qr, png };
// }


// export async function redeemQR(code: string, signature: string, staffId: ObjectId, station?: string) {
// const qr = await QrModel.findOneAndUpdate(
// { code, signature, state: 'active', ...(process.env.QR_TTL_MINUTES ? { expiresAt: { $gt: new Date() } } : {}) },
// { $set: { state: 'redeemed', redeemedAt: new Date(), redeemedBy: staffId } },
// { new: true }
// );
// if (!qr) throw new Error('INVALID_OR_USED');
// if (qr.kind === 'order') await OrderModel.updateOne({ _id: qr.refId }, { $set: { status: 'served' } });
// if (qr.kind === 'ticket') await TicketModel.updateOne({ _id: qr.refId }, { $set: { status: 'redeemed' } });
// return qr;
// }