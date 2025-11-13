import mongoose from 'mongoose';

import { env } from '../config/env';

export async function connectMongo() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  mongoose.set('strictQuery', true);

  await mongoose.connect(env.MONGO_URI, {
    autoIndex: env.NODE_ENV !== 'production',
  });

  console.log(`✅ Mongo conectado: ${env.MONGO_URI}`);
  return mongoose.connection;
}
