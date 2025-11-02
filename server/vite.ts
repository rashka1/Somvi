import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";

export function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [express] ${message}`);
}

export async function setupVite(app: Express, isProd: boolean) {
  if (isProd) {
    const distPath = path.resolve("dist");

    if (!fs.existsSync(distPath)) {
      throw new Error(
        `Could not find the production build. Please run 'npm run build' before starting the server in production mode.`,
      );
    }

    app.use(express.static(distPath, { index: false }));

    app.use((req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }

      const indexPath = path.join(distPath, "index.html");
      res.sendFile(indexPath);
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    app.use(vite.middlewares);

    app.use(async (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }

      const url = req.originalUrl;

      try {
        let template = fs.readFileSync(
          path.resolve("index.html"),
          "utf-8",
        );

        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  }
}

export function serveStatic(app: Express) {
  const distPath = path.resolve("dist");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the production build at ${distPath}. Please run 'npm run build' before starting the server.`,
    );
  }

  app.use(express.static(distPath));
  log(`Serving static files from ${distPath}`);
}
