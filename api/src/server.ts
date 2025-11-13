import http from 'http';

import { app } from './app';
import { connectMongo } from './config/db';
import { env } from './config/env';

async function bootstrap() {
  await connectMongo();

  const server = http.createServer(app);
  server.listen(env.PORT, () => {
    console.log(`🚀 Server is running on port ${env.PORT}`);
    console.log(`📊 Environment: ${env.NODE_ENV}`);
  });
}

bootstrap().catch(err => {
  console.error('❌ Falla en bootstrap:', err);
  process.exit(1);
});
