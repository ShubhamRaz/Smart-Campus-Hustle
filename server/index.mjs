import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import db from './db/connection.js';
import { seedDatabase } from './db/seed.js';
import { rateLimiter } from './middleware/rateLimit.js';
import { authMiddleware } from './middleware/auth.js';
import { tenantMiddleware } from './middleware/tenant.js';

import { handleAuthRoutes } from './routes/authRoutes.js';
import { handleAcademicRoutes } from './routes/academicRoutes.js';
import { handleOperationsRoutes } from './routes/operationsRoutes.js';
import { handleFinanceRoutes } from './routes/financeRoutes.js';
import { handleLibraryRoutes } from './routes/libraryRoutes.js';
import { handleCareerAlumniRoutes } from './routes/careerAlumniRoutes.js';
import { handleIdentitySaasRoutes } from './routes/identitySaasRoutes.js';
import { handleUniversityRoutes } from './routes/universityRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB and ensure seed data is loaded
seedDatabase();

const PORT = process.env.PORT || 5050;

// Connected SSE clients for live broadcasts
const sseClients = new Set();

export function broadcastEvent(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Background simulator for Smart Transport GPS telemetry updates (every 5 seconds)
setInterval(() => {
  try {
    const bus = db.prepare('SELECT * FROM transport_vehicles WHERE id = "bus_1"').get();
    if (bus) {
      // Simulate minor GPS drift along the route
      const newLat = +(bus.current_lat + (Math.random() - 0.48) * 0.001).toFixed(6);
      const newLng = +(bus.current_lng + (Math.random() - 0.48) * 0.001).toFixed(6);
      const newSpeed = +(30 + Math.random() * 15).toFixed(1);
      const newEta = Math.max(1, (bus.eta_minutes || 5) + (Math.random() > 0.7 ? -1 : 0));

      db.prepare('UPDATE transport_vehicles SET current_lat = ?, current_lng = ?, speed_kmh = ?, eta_minutes = ?, last_ping = CURRENT_TIMESTAMP WHERE id = "bus_1"')
        .run(newLat, newLng, newSpeed, newEta);

      broadcastEvent('BUS_TELEMATICS_UPDATE', {
        busId: bus.id,
        busNumber: bus.bus_number,
        lat: newLat,
        lng: newLng,
        speedKmh: newSpeed,
        etaMinutes: newEta
      });
    }
  } catch (err) {
    // Ignore ticker errors
  }
}, 5000);

const server = http.createServer((req, res) => {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-ID');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Real-time Server-Sent Events stream
  if (pathname === '/api/live-stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write('retry: 10000\n\n');
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // Rate Limiting
  rateLimiter(req, res, () => {
    // Parse body for POST/PUT
    let rawBody = '';
    req.on('data', chunk => { rawBody += chunk; });
    req.on('end', () => {
      let body = {};
      if (rawBody) {
        try {
          body = JSON.parse(rawBody);
        } catch {
          body = {};
        }
      }

      // Authentication Middleware
      authMiddleware(req, res, () => {
        // Multi-Tenant Isolation Middleware
        tenantMiddleware(req, res, () => {
          // Route Dispatcher
          if (
            handleAuthRoutes(req, res, pathname, body) ||
            handleAcademicRoutes(req, res, pathname, body) ||
            handleOperationsRoutes(req, res, pathname, body) ||
            handleFinanceRoutes(req, res, pathname, body) ||
            handleLibraryRoutes(req, res, pathname, body) ||
            handleCareerAlumniRoutes(req, res, pathname, body) ||
            handleIdentitySaasRoutes(req, res, pathname, body) ||
            handleUniversityRoutes(req, res, pathname, body)
          ) {
            return;
          }

          // Static asset serving if dist/ exists
          const distDir = path.join(__dirname, '..', 'dist');
          if (fs.existsSync(distDir) && !pathname.startsWith('/api')) {
            let filePath = path.join(distDir, pathname === '/' ? 'index.html' : pathname);
            if (!fs.existsSync(filePath)) {
              filePath = path.join(distDir, 'index.html');
            }

            const ext = path.extname(filePath).toLowerCase();
            const mimeTypes = {
              '.html': 'text/html',
              '.js': 'application/javascript',
              '.css': 'text/css',
              '.json': 'application/json',
              '.png': 'image/png',
              '.svg': 'image/svg+xml'
            };

            try {
              const content = fs.readFileSync(filePath);
              res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
              res.end(content);
              return;
            } catch {
              // fallback to 404
            }
          }

          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'NOT_FOUND', path: pathname }));
        });
      });
    });
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Smart Campus Multi-Tenant Cloud API Server Running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🏢 Multi-Tenant DB: SQLite ACID Engine (68 Relations Active)`);
  console.log(`⚡ Real-Time Telematics & SSE Stream Active on /api/live-stream`);
  console.log(`=======================================================`);
});
