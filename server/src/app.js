import express from "express";
import cors from "cors";
import fs from "fs";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import itineraryRoutes from "./routes/itinerary.routes.js";
import tripRoutes from "./routes/trip.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import aiRoutes from "./routes/ai.routes.js";

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();

// ==================== SECURITY & CSP ====================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'",
        'https://voyago-jvit.onrender.com',
        'wss://voyago-jvit.onrender.com',
        process.env.CLIENT_URL,
        'http://localhost:5000',
        'ws://localhost:5000',
        process.env.PYTHON_SERVICE_URL
      ].filter(Boolean),
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://accounts.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      fontSrc: ["'self'", "data:"],
      mediaSrc: ["'self'", "https://res.cloudinary.com"],
      frameSrc: ["'self'", "https://accounts.google.com"]
    },
  },
}));

// Rate limiting for Auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use("/api/v1/auth", authLimiter);

// ==================== CORS ====================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://voyago-jvit.onrender.com',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/expenses", expenseRoutes);
app.use("/api/v1/itinerary", itineraryRoutes);
app.use("/api/v1/trips", tripRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/ai", aiRoutes);

// --- Static Frontend Serving ---
const clientDist = path.join(__dirname, "../../client/dist");
if (fs.existsSync(clientDist)) {
  console.log(`✅ Serving static files from: ${clientDist}`);
  app.use(express.static(clientDist));

  app.get('*', (req, res, next) => {
    // Skip API routes so they fall through to the notFound handler
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  console.warn(`⚠️ Client build not found at: ${clientDist}`);
}

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;