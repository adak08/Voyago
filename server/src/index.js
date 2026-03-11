import dotenv from "dotenv";

import http from "http";
import app from "./app.js";
import connectDB from "./config/db.config.js";
import { initSocket } from "./config/socket.config.js";
import path from "path";
import { fileURLToPath } from "url";
import scheduleTripStatusCron from "./services/tripStatus.cron.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);



connectDB().then(() => {
    scheduleTripStatusCron();
    server.listen(PORT, () => {
        console.log(
            `🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`
        );
    });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err.message);

    const redisConnectionIssue =
        /WRONGPASS|NOAUTH|Redis|ECONNREFUSED/i.test(err.message || "");

    if (redisConnectionIssue) {
        console.error("Continuing with in-memory Socket.IO adapter");
        return;
    }

    server.close(() => process.exit(1));
});
