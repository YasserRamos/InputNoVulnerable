import express from "express";
import acceso from "./rutas/acceso.js";
import rutaSync from "./rutas/sincronizar.js";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

const PORT = process.env.PORT || 3002;

const app = express();

// Proxy para Render/Railway
app.set("trust proxy", 1);

/* ============================
   RATE LIMIT GLOBAL
============================ */
const globalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(globalLimiter);

/* ============================
   CORS SEGURO
============================ */
app.use(cors({
  origin: [
    "https://inputnovulnerable.onrender.com",
    "http://localhost:5173"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

/* ============================
   BODY
============================ */
app.use(express.json());

/* ============================
   HELMET
============================ */
app.use(helmet());

// Evita iframes
app.use(helmet.frameguard({
  action: "deny"
}));

// CSP compatible con React
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:"
      ],
      connectSrc: [
        "'self'",
        "https://inputnovulnerable.onrender.com"
      ],
      frameAncestors: ["'none'"]
    }
  })
);

/* ============================
   RUTAS
============================ */
app.use("/api", acceso);
app.use("/api/sync", rutaSync);

/* ============================
   TEST
============================ */
app.get("/api/prueba", (req, res) => {
  res.send("🚀 Servidor funcionando correctamente");
});

/* ============================
   START
============================ */
app.listen(PORT, () => {
  console.log("Backend en puerto:", PORT);
});
