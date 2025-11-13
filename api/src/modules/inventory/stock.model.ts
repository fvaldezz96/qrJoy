import { Document, model, Schema, Types } from 'mongoose';

export type StockLocation = 'bar' | 'restaurant' | 'door';

export interface IStock extends Document {
  productId: Types.ObjectId;
  location: StockLocation;
  quantity: number;
  threshold?: number;
}

const StockSchema = new Schema<IStock>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    location: { type: String, enum: ['bar', 'restaurant', 'door'], required: true, index: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    threshold: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true },
);

StockSchema.index({ productId: 1, location: 1 }, { unique: true });

export const Stock = model<IStock>('Stock', StockSchema);
