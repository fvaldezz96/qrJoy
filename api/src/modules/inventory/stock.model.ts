import { Types } from "mongoose";

export interface IStock {
_id: Types.ObjectId;
productId: Types.ObjectId;
location: 'bar' | 'restaurant' | 'door';
quantity: number; // current stock
threshold?: number; // low-stock alert
}