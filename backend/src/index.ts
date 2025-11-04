import "./preload";
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


async function startServer() {
  const app = express();

  // Middleware MUST be configured before routes
  const exactAllowedOrigins = new Set([
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    'https://karuna-setu-foundation.vercel.app',
  ]);

  const vercelPreviewRegex = /^https?:\/\/.*\.vercel\.app$/i;

  app.use(cors({
    origin: function (origin, callback) {
      // Allow same-origin/no-origin requests (like curl or server-to-server)
      if (!origin) return callback(null, true);

      if (
        exactAllowedOrigins.has(origin) ||
        vercelPreviewRegex.test(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  }));

  app.use(express.json());

  // Health check
  app.get("/health", (_req, res) => res.json({ ok: true }));

  // Static files
  const uploadsPath = path.resolve(__dirname, "../public/uploads");
  app.use("/uploads", express.static(uploadsPath));

  // API Routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: process.env.PING_MESSAGE || "pong" });
  });
  app.get("/api/demo", handleDemo);
  app.use("/api/admin", authRouter);
  app.use("/api/gallery", galleryRouter);
  app.use("/api/donors", donorsRouter);
  app.use("/api/members", membersRouter);
  app.use("/api/celebrations", celebrationsRouter);
  app.use("/api/orders", ordersRouter);

  // Await critical initializations before starting the server
  await initAdminHash();
  await connectMongo();

  // Start server
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
