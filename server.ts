import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

import carparksHandler from "./api/carparks.js";
import weatherHandler from "./api/weather.js";
import deviationsHandler from "./api/deviations.js";
import healthHandler from "./api/health.js";

// Load environment variables from .env if present
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mount the 4 serverless API endpoints
  app.all("/api/carparks", (req, res) => carparksHandler(req, res));
  app.all("/api/weather", (req, res) => weatherHandler(req, res));
  app.all("/api/deviations", (req, res) => deviationsHandler(req, res));
  app.all("/api/health", (req, res) => healthHandler(req, res));

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Carpark Exception Board server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
