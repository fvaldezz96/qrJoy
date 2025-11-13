import { Document, model, Schema } from 'mongoose';

export type ProductCategory = 'drink' | 'food' | 'ticket';

export interface IProduct extends Document {
  name: string;
  category: ProductCategory;
  price: number;
  imageUrl?: string;
  sku: string;
  active: boolean;
  _id: string;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, index: true },
    category: { type: String, enum: ['drink', 'food', 'ticket'], required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    imageUrl: String,
    sku: { type: String, sparse: true, index: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const Product = model<IProduct>('Product', ProductSchema);
