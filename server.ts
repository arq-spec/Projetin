import express from "express";
import path from "path";
import mongoose from "mongoose";
import { connectToDatabase, getMongoUri } from "./src/mongodb-migration/db";
import { KeyValueModel } from "./src/mongodb-migration/kv.schema";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // In-memory server database cache fallback
  const inMemoryDbStore: Record<string, any> = {};

  // Try connecting to MongoDB asynchronously in the background
  connectToDatabase().catch((err) => {
    console.warn('[Server DB] MongoDB connection not active, using in-memory store:', err?.message || err);
  });

  // Body parsers
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API endpoint to inspect MongoDB connection status
  app.get("/api/db-status", async (req: express.Request, res: express.Response) => {
    try {
      const isConnected = await connectToDatabase();
      const state = mongoose.connection.readyState;
      const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
      return res.json({
        success: true,
        connected: (state as number) === 1,
        status: states[state] || 'unknown',
        mongodbConfigured: Boolean(getMongoUri()),
        databaseName: mongoose.connection.db ? mongoose.connection.db.databaseName : null
      });
    } catch (err: any) {
      return res.json({ success: false, connected: false, error: err?.message || 'Error checking DB status' });
    }
  });

  // API GET route to load persistent key-value data
  app.get("/api/db/:key", async (req: express.Request, res: express.Response) => {
    const dbKey = String(req.params.key || '');
    try {
      await connectToDatabase();
      
      if ((mongoose.connection.readyState as number) === 1) {
        const doc = await KeyValueModel.findOne({ key: dbKey }).lean();
        if (doc && doc.data !== undefined && doc.data !== null) {
          inMemoryDbStore[dbKey] = doc.data;
          return res.json({ success: true, data: doc.data });
        }
      }

      if (inMemoryDbStore[dbKey] !== undefined) {
        return res.json({ success: true, data: inMemoryDbStore[dbKey] });
      }
      return res.json({ success: true, data: null });
    } catch (error: any) {
      console.warn(`[Server DB] Error reading key ${dbKey}:`, error?.message);
      const cached = inMemoryDbStore[dbKey];
      return res.json({ success: true, data: cached !== undefined ? cached : null });
    }
  });

  // API POST route to save persistent key-value data
  app.post("/api/db/:key", async (req: express.Request, res: express.Response) => {
    const dbKey = String(req.params.key || '');
    const { data } = req.body;

    try {
      inMemoryDbStore[dbKey] = data;

      await connectToDatabase();

      if ((mongoose.connection.readyState as number) === 1) {
        await KeyValueModel.findOneAndUpdate(
          { key: dbKey },
          { $set: { key: dbKey, data, updatedAt: new Date() } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
      return res.json({ success: true });
    } catch (error: any) {
      console.warn(`[Server DB] Error saving key ${dbKey}:`, error?.message);
      return res.json({ success: true, cached: true });
    }
  });



  // API route for proxying WhatsApp requests (bypasses CORS and client constraints)
  app.post("/api/whatsapp/send", async (req: express.Request, res: express.Response) => {
    try {
      const { endpoint, method = "POST", headers = {}, body = null } = req.body;
      
      if (!endpoint) {
        return res.status(400).json({ error: "Missing 'endpoint' parameter" });
      }

      console.log(`[Proxy] Routing ${method} request to: ${endpoint}`);
      
      const fetchOptions: any = {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      };

      if (body && method !== "GET" && method !== "HEAD") {
        fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
      }

      const response = await fetch(endpoint, fetchOptions);
      const responseText = await response.text();
      
      // Forward target server's response status
      res.status(response.status);
      
      // Try parsing and sending as JSON if valid, otherwise send raw text
      try {
        const json = JSON.parse(responseText);
        return res.json(json);
      } catch {
        return res.send(responseText);
      }
    } catch (error: any) {
      const isNetworkError = error.code === "EHOSTUNREACH" || 
                             error.code === "ENOTFOUND" || 
                             error.code === "ECONNREFUSED" || 
                             error.code === "ETIMEDOUT" ||
                             error.message?.includes("fetch failed") ||
                             error.message?.includes("unreachable");

      if (isNetworkError) {
        return res.status(502).json({
          error: "Unreachable endpoint",
          message: `O servidor externo de WhatsApp está inacessível ou offline (${error.message || "fetch failed"}). Verifique se a URL Base está correta e se o servidor está ativo. Se estiver usando uma API própria ou VPS, verifique as regras de firewall.`,
          code: error.code || "EHOSTUNREACH"
        });
      }

      return res.status(500).json({
        error: error.message || "Failed to proxy request",
        details: error.stack,
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
