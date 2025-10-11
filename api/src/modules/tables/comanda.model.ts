import { Types } from "mongoose";
import { IOrderItem } from "../orders/order.model";

export type ComandaStatus = 'queued'|'in_progress'|'served'|'cancelled';
export interface IComanda {
_id: Types.ObjectId;
orderId: Types.ObjectId;
station: 'bar'|'kitchen';
items: IOrderItem[];
status: ComandaStatus;
notes?: string;
createdAt: Date;
updatedAt: Date;
}