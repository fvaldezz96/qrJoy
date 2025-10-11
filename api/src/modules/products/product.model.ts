import { Types } from "mongoose";

export interface IProduct {
_id: Types.ObjectId;
name: string;
category: 'drink' | 'food' | 'ticket';
price: number;
active: boolean;
sku?: string;
imageUrl?: string;
}