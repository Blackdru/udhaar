const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const dbRepo = require('./db');
const { initWebSocket } = require('./services/websocket');

const authRoutes = require('./routes/auth.routes');
const businessRoutes = require('./routes/business.routes');
const publicRoutes = require('./routes/public.routes');
const transactionRoutes = require('./routes/transaction.routes');
const customerRoutes = require('./routes/customer.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const notificationRoutes = require('./routes/notification.routes');

const app = express();
const server = http.createServer(app);

// Initialize real-time WebSockets
initWebSocket(server);

// Security Headers via Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Health check handler (supports both /health and /api/health)
const healthHandler = async (req, res) => {
  let dbStatus = 'connected';
  try {
    if (dbRepo.isSupabase && dbRepo.supabaseClient) {
      const { error } = await dbRepo.supabaseClient.from('businesses').select('id').limit(1);
      if (error) dbStatus = 'error: ' + error.message;
    } else if (dbRepo.sqliteDb) {
      dbRepo.sqliteDb.prepare('SELECT 1').get();
    }
  } catch (err) {
    dbStatus = 'disconnected: ' + (err.message || 'unknown error');
  }

  const isHealthy = !dbStatus.startsWith('error') && !dbStatus.startsWith('disconnected');

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'Udhaar V1 API Engine',
    uptime: Math.floor(process.uptime()),
    database: {
      mode: dbRepo.isSupabase ? 'Supabase PostgreSQL' : 'Local SQLite',
      status: dbStatus
    },
    storageMode: dbRepo.isSupabase ? 'Supabase Storage' : 'Local Disk',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
};

// Health checks: root /health and /api/health (mounted before rate limiter to prevent probe throttling)
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Global API Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api', globalLimiter);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Serve uploaded receipts statically with permissive cross-origin access
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(uploadsDir));

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/owner/transactions', transactionRoutes);
app.use('/api/owner/customers', customerRoutes);
app.use('/api/owner/analytics', analyticsRoutes);
app.use('/api/owner/notifications', notificationRoutes);

// Global 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Endpoint not found: ${req.method} ${req.url}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled API Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An internal server error occurred.'
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  await dbRepo.init();

  server.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 Udhaar V1 Production Backend running at http://localhost:${PORT}`);
    if (dbRepo.isSupabase) {
      console.log(`☁️  Database: Live SUPABASE PostgreSQL (${process.env.SUPABASE_URL})`);
      console.log(`📦 Storage: Supabase Storage Bucket ('receipts')`);
    } else {
      console.log(`💾 Database: Local SQLite (udhaar.db)`);
      console.log(`📂 Storage: Local Disk (${uploadsDir})`);
    }
    console.log(`📡 WebSocket: Real-time broadcast ready`);
    console.log(`🛡️  Security: Helmet & Rate Limiter active`);
    console.log(`===============================================`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
