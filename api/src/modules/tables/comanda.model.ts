import { Document, model, Schema, Types } from 'mongoose';

export type Station = 'bar' | 'kitchen';
export type ComandaStatus = 'pending' | 'in_progress' | 'done';

export interface IComandaItem {
  productId: Types.ObjectId;
  qty: number;
  note?: string;
}

export interface IComanda extends Document {
  orderId: Types.ObjectId;
  station: Station;
  items: IComandaItem[];
  status: ComandaStatus;
}

const ComandaItemSchema = new Schema<IComandaItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, required: true, min: 1 },
    note: String,
  },
  { _id: false },
);

const ComandaSchema = new Schema<IComanda>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    station: { type: String, enum: ['bar', 'kitchen'], required: true, index: true },
    items: { type: [ComandaItemSchema], required: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'done'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true },
);

export const Comanda = model<IComanda>('Comanda', ComandaSchema);
