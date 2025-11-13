import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { IUser, User } from '../users/user.model';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const JWT_EXPIRES_IN = '7d';

export type SignPayload = { _id: string; role: 'user' | 'admin' | 'employee'; email: string };

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function comparePassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: SignPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export async function createUser(opts: {
  email: string;
  password: string;
  role?: 'user' | 'admin' | 'employee';
  name?: string;
}) {
  const exists = await User.findOne({ email: opts.email });
  if (exists) throw new Error('EMAIL_TAKEN');

  const passwordHash = await hashPassword(opts.password);
  const doc = await User.create({
    email: opts.email,
    passwordHash,
    role: opts.role ?? 'user',
    name: opts.name,
  });

  const token = signToken({ _id: doc._id.toString(), role: doc.role, email: doc.email });
  return { user: sanitizeUser(doc), token };
}

export async function loginUser(opts: { email: string; password: string }) {
  const user = await User.findOne({ email: opts.email });
  if (!user) throw new Error('INVALID_CREDENTIALS');
  const ok = await comparePassword(opts.password, user.passwordHash);
  if (!ok) throw new Error('INVALID_CREDENTIALS');

  const token = signToken({ _id: user._id.toString(), role: user.role, email: user.email });
  return { user: sanitizeUser(user), token };
}

export function sanitizeUser(user: Pick<IUser, '_id' | 'email' | 'role' | 'name'> & any) {
  return {
    _id: user._id,
    email: user.email,
    role: user.role,
    name: user.name ?? null,
  };
}
