import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { publicRouter } from './server/routes/public.ts';
import { userRouter } from './server/routes/user.ts';
import { adminRouter } from './server/routes/admin.ts';
import { loadDatabase } from './server/db.ts';

dotenv.config();

// Initialize database
loadDatabase();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON & URL-encoded body parser with security limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Basic security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Porn Gabar Engine',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API routers
  app.use('/api', publicRouter);
  app.use('/api', userRouter);
  app.use('/api/admin', adminRouter);

  // Vite middleware for dev or static serving for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Porn Gabar Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
