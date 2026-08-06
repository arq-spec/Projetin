import express from "express";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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
