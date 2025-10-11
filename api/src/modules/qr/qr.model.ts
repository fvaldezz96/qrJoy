import { Types } from "mongoose";

export type QRKind = 'order' | 'ticket';
export type QRState = 'active' | 'redeemed' | 'expired';
export interface IQR {
_id: Types.ObjectId;
kind: QRKind;
refId: Types.ObjectId;
code: string;
signature: string;
state: QRState;
expiresAt?: Date;
createdAt: Date;
redeemedAt?: Date;
redeemedBy?: Types.ObjectId;
}