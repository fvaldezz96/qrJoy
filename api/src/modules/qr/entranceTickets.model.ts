// src/modules/tickets/entranceTickets.model.ts
import { Document, model, Schema, Types } from 'mongoose';

export type TicketType = 'joypark' | 'joyweek' | 'joybox';
export type TicketStatus = 'active' | 'used' | 'cancelled';

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
}

export interface IEntranceTicket extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: TicketType;
  price: number;
  status: TicketStatus;
  qrId: Types.ObjectId;
  purchaseDate: Date;
  usedAt?: Date;
  usedBy?: Types.ObjectId;
  validUntil?: Date;
  metadata?: {
    includesFood?: boolean;
    includesDrinks?: boolean;
    accessAreas?: string[];
    durationHours?: number;
  };
}

export interface IPopulatedEntranceTicket extends Omit<IEntranceTicket, 'userId' | 'usedBy'> {
  userId: IUser;
  usedBy?: IUser;
}

const EntranceTicketSchema = new Schema<IEntranceTicket>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['joypark', 'joyweek', 'joybox'], required: true },
    price: { type: Number, required: true },
    status: { type: String, enum: ['active', 'used', 'cancelled'], default: 'active' },
    qrId: { type: Schema.Types.ObjectId, ref: 'QR', required: true },
    purchaseDate: { type: Date, default: Date.now },
    usedAt: { type: Date },
    usedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    validUntil: { type: Date },
    metadata: {
      includesFood: Boolean,
      includesDrinks: Boolean,
      accessAreas: [String],
      durationHours: Number,
    },
  },
  { timestamps: true },
);

export const EntranceTicket = model<IEntranceTicket>('EntranceTicket', EntranceTicketSchema);
