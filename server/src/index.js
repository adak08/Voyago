import dotenv from "dotenv";
import http from "http";
import express from "express";
import app from "./app.js";
import connectDB from "./config/db.config.js";
import { initSocket } from "./config/socket.config.js";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import scheduleTripStatusCron from "./services/tripStatus.cron.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// --- Environment Variable Validation ---
console.log('🚀 Starting server...');
console.log('📋 Environment Check:', {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || '5000 (default)',
  MONGODB_URI: process.env.MONGODB_URI ? '✅ Set' : '❌ MISSING',
  JWT_SECRET: process.env.JWT_SECRET ? '✅ Set' : '❌ MISSING'
});

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

connectDB().then(() => {
    scheduleTripStatusCron();

    // Explicitly bind to 0.0.0.0 for Docker/Render compatibility
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
}).catch((err) => {
    console.error("❌ Fatal error during startup:", err);
    // Bind server anyway so Render doesn't loop-crash on health checks
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`⚠️ Server running on port ${PORT} but startup failed.`);
    });
});

// Handle unhandled promise rejections gracefully
process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err?.message || err);

    const redisConnectionIssue = /WRONGPASS|NOAUTH|Redis|ECONNREFUSED/i.test(err?.message || "");
    if (redisConnectionIssue) {
        console.error("Continuing with in-memory Socket.IO adapter");
        return;
    }

    // Do not abruptly crash the server. Let Render manage the process life cycle.
    console.error("⚠️ Caught unhandled rejection, check logs.");
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err?.message || err);
    console.error(err.stack);
});
