import { model, Schema, Types } from 'mongoose';

export interface ITicket {
  _id: Types.ObjectId;
  qrId?: Types.ObjectId;
  userId: Types.ObjectId;
  orderId: Types.ObjectId;
  name: string;
  email: string;
  qrCode: string;
  redeemed: boolean;
  status: 'issued' | 'paid' | 'redeemed';
  redeemedAt?: Date;
  createdAt: Date;
  tableNumber: number;
  total?: number;
  items?: Array<{
    productId: Types.ObjectId;
    name: string;
    qty: number;
    price: number;
    subtotal: number;
  }>;
}

const TicketSchema = new Schema<ITicket>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    qrCode: { type: String, required: true, unique: true },
    qrId: { type: Schema.Types.ObjectId, ref: 'QR' },
    redeemed: { type: Boolean, default: false },
    redeemedAt: { type: Date },
    status: { type: String, enum: ['issued', 'paid', 'redeemed'], required: true },
    tableNumber: { type: Number, required: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Ticket = model<ITicket>('Ticket', TicketSchema);
