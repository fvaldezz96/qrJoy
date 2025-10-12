import { Document, model, Schema } from 'mongoose';

export interface ITable extends Document {
  number: number;
  name?: string;
  active: boolean;
  capacity: number;
}

const TableSchema = new Schema<ITable>(
  {
    number: { type: Number, required: true, unique: true },
    name: { type: String, required: false, unique: true },
    capacity: { type: Number, required: false, min: 1, max: 20 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Table = model<ITable>('Table', TableSchema);
