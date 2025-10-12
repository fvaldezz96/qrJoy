import mongoose, { Document, model, Schema, Types } from 'mongoose';

export type OrderStatus = 'pending' | 'paid' | 'ready' | 'served' | 'cancelled';
export type OrderType = 'bar' | 'restaurant';

export interface IOrderItem {
  productId: Types.ObjectId;
  qty: number;
  price: number;
  note?: string;
}

export interface IOrder extends Document {
  _id: string | mongoose.Types.ObjectId;
  userId?: Types.ObjectId | string;
  tableId?: Types.ObjectId;
  type: OrderType;
  items: IOrderItem[];
  total: number;
  status: OrderStatus;
  qrId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    note: String,
  },
  { _id: false },
);

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    tableId: { type: Schema.Types.ObjectId, ref: 'Table', index: true },
    type: { type: String, enum: ['bar', 'restaurant'], required: true, index: true },
    items: { type: [OrderItemSchema], required: true, validate: (v: any) => v.length > 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'paid', 'ready', 'served', 'cancelled'],
      default: 'pending',
      index: true,
    },
    qrId: { type: Schema.Types.ObjectId, ref: 'QR', index: true },
  },
  { timestamps: true },
);

OrderSchema.index({ createdAt: -1 });

export const Order = model<IOrder>('Order', OrderSchema);
