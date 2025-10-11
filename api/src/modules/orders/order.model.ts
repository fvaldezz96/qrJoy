import { Types } from "mongoose";

export type OrderStatus = 'pending'|'paid'|'ready'|'served'|'cancelled';
export interface IOrderItem { productId: Types.ObjectId; qty: number; price: number; note?: string; }
export interface IOrder {
_id: Types.ObjectId;
userId?: Types.ObjectId;
tableId?: Types.ObjectId;
type: 'bar' | 'restaurant';
items: IOrderItem[];
total: number;
status: OrderStatus;
qrId?: Types.ObjectId;
createdAt: Date;
}