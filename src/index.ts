import { serve } from '@hono/node-server';
import app from './app';

const PORT = process.env.PORT || 8080;

serve({
  fetch: app.fetch,
  port: Number(PORT),
});

console.log(`🚀 Server is running on http://localhost:${PORT}`);
