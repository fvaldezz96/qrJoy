import { Types } from "mongoose";

export type TicketStatus = 'issued'|'paid'|'redeemed'|'cancelled';
export interface ITicket {
_id: Types.ObjectId;
userId: Types.ObjectId;
eventDate: Date;
price: number;
status: TicketStatus;
qrId: Types.ObjectId;
}