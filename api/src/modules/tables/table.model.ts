import { Types } from "mongoose";

export interface ITable { _id: Types.ObjectId; name: string; capacity: number; active: boolean; }