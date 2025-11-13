import { model, Schema, Types } from 'mongoose';

export type QRState = 'active' | 'redeemed' | 'expired';
export type QRKind = 'order' | 'ticket' | 'entrance';
export type TicketType = 'joypark' | 'joyweek' | 'joybox';

export interface IQR {
  _id: Types.ObjectId;
  kind: QRKind;
  refId: Types.ObjectId;
  code: string;
  signature: string;
  state: QRState;
  createdAt: Date;
  expiresAt?: Date;
  redeemedAt?: Date;
  redeemedBy?: Types.ObjectId;
  ticketType?: TicketType;
  metadata?: any;
}

const QRSchema = new Schema<IQR>(
  {
    kind: { type: String, enum: ['order', 'ticket', 'entrance'], required: true },
    refId: { type: Schema.Types.ObjectId, required: true },
    code: { type: String, required: true, unique: true },
    signature: { type: String, required: true },
    state: { type: String, enum: ['active', 'redeemed', 'expired'], default: 'active' },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    redeemedAt: { type: Date },
    redeemedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: false },
);

export const QR = model<IQR>('QR', QRSchema);
