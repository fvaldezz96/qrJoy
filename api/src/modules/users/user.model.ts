import { Document, model, Schema } from 'mongoose';

export type UserRole = 'user' | 'admin' | 'employee';

export interface IUser extends Document {
  _id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  name?: string;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin', 'employee'], default: 'user', index: true },
    name: { type: String },
  },
  { timestamps: true },
);

export const User = model<IUser>('User', UserSchema);
