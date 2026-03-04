import express from "express";
import acceso from "./rutas/acceso.js";
import rutaSync from "./rutas/sincronizar.js";
import helmet from "helmet";
import cors from "cors";

const PORT = process.env.PORT || 3002;
const app = express();

// Proxy para Render/Railway
app.set("trust proxy", 1);

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

app.use(helmet.frameguard({
  action: "deny"
}));

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
   MIDDLEWARE LOG IP
============================ */
app.use((req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  console.log("Solicitud desde IP:", ip, "Ruta:", req.originalUrl);
  next();
});

/* ============================
   RUTAS
============================ */
app.use("/api", acceso);
app.use("/api/sync", rutaSync);

/* ============================
   TEST
============================ */
app.get("/api/prueba", (req, res) => {
  res.json({
    mensaje: "Servidor funcionando correctamente",
    ip: req.ip
  });
});

/* ============================
   MANEJO GLOBAL DE ERRORES
============================ */
app.use((err, req, res, next) => {
  console.log("ERROR GLOBAL:", err);
  res.status(500).json({
    error: "Error interno del servidor"
  });
});

/* ============================
   START
============================ */
app.listen(PORT, () => {
  console.log("Backend en puerto:", PORT);
});