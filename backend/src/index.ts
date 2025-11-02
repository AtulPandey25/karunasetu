import "./dotenv-loader";

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { connectMongo } from "@/db";
import { initAdminHash } from "@/auth";

// Import route handlers
import { handleDemo } from "@/routes/demo";
import galleryRouter from "@/routes/gallery";
import donorsRouter from "@/routes/donors";
import authRouter from "@/routes/auth";
import membersRouter from "@/routes/members";
import celebrationsRouter from "@/routes/celebrations";
import ordersRouter from "@/routes/orders";

const app = express();

// Initialize
initAdminHash().catch(err => console.error("Failed to init admin hash", err));
connectMongo().catch(err => console.error("Failed to connect MongoDB", err));


// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// Static files
const uploadsPath = path.resolve(__dirname, "../public/uploads");
app.use("/uploads", express.static(uploadsPath));

// Middleware MUST be configured before routes
const allowedOrigins = [
  'http://localhost:8080', // Local dev frontend
  'https://karunaapi.onrender.com', // Deployed backend
  'https://karuna-setu-foundation.vercel.app', // Production Vercel frontend URL
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '' // For Vercel preview deployments
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

// API Routes
app.get("/api/ping", (_req, res) => {
  res.json({ message: process.env.PING_MESSAGE || "pong" });
});

app.get("/api/demo", handleDemo);

// Admin auth
app.use("/api/admin", authRouter);

// Application routes
app.use("/api/gallery", galleryRouter);
app.use("/api/donors", donorsRouter);
app.use("/api/members", membersRouter);
app.use("/api/celebrations", celebrationsRouter);
app.use("/api/orders", ordersRouter);

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  // Server startup message is handled by the deployment service
});
