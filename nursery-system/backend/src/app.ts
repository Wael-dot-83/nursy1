import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { router } from "./routes";
import { errorHandler } from "./middleware/errorHandler";

export function buildApp() {
  const app = express();

  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", router);

  app.use(errorHandler);

  return app;
}

export async function startServer() {
  const app = buildApp();
  app.listen(env.PORT, () => {
    console.log(`API listening on port ${env.PORT}`);
  });
}
