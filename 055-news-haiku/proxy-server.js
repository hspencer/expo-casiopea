/**
 * proxy-server.js — Mini proxy local para la API de xAI (Grok)
 *
 * Resuelve el problema de CORS: el browser no puede llamar directamente
 * a api.x.ai porque no envía headers Access-Control-Allow-Origin.
 * Este servidor corre en localhost:3001 y reenvía las peticiones.
 *
 * Uso:   node proxy-server.js
 * Luego: el sketch llama a http://localhost:3001/haiku
 *
 * Sin dependencias externas — usa solo módulos nativos de Node.js.
 */


const http = require("http");
const https = require("https");

const PORT = 3001;
const XAI_API_URL = "https://api.x.ai/v1/chat/completions";
const XAI_API_KEY = "xai-sGo65CjgX6o9oNDtvO2bEL1fsFy4s8dEfbkmLMZIN43LqyNK4LL6B3F8BvWurSKSvXAtVBgLkzShdeNK";

const server = http.createServer((req, res) => {
  // Headers CORS para que el browser permita la llamada
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight OPTIONS
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Solo aceptar POST a /haiku
  if (req.method !== "POST" || req.url !== "/haiku") {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
    return;
  }

  // Leer el body del request
  let body = "";
  req.on("data", chunk => { body += chunk; });
  req.on("end", () => {
    // Reenviar a xAI
    const postData = Buffer.from(body, "utf-8");
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + XAI_API_KEY,
        "Content-Length": postData.length
      }
    };

    const proxyReq = https.request(XAI_API_URL, options, (proxyRes) => {
      let respBody = "";
      proxyRes.on("data", chunk => { respBody += chunk; });
      proxyRes.on("end", () => {
        res.writeHead(proxyRes.statusCode, { "Content-Type": "application/json" });
        res.end(respBody);
      });
    });

    proxyReq.on("error", (err) => {
      console.error("Error al conectar con xAI:", err.message);
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    });

    proxyReq.write(postData);
    proxyReq.end();
  });
});

server.listen(PORT, () => {
  console.log(`Proxy xAI corriendo en http://localhost:${PORT}/haiku`);
});
