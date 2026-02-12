import express from "express";
import conexion from "../conexionDB.js";
import { verificarAdmin } from "../Middlewares/verificarAdmin.js";
import rateLimit from "express-rate-limit";

/* ============================
   DELAY ANTI-SPAM
============================ */
const ultimasPeticiones = new Map();
const DELAY_MS = 2000; // 2 segundos

function verificarDelay(req) {

  const ip = req.ip;
  const ahora = Date.now();

  const ultima = ultimasPeticiones.get(ip) || 0;

  if (ahora - ultima < DELAY_MS) {
    return false;
  }

  ultimasPeticiones.set(ip, ahora);
  return true;
}

const router = express.Router();

/* ============================
   LIMITADOR GLOBAL
============================ */
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiadas solicitudes. Intenta más tarde."
  }
});

// Aplica a todas las rutas
router.use(limiter);

/* ============================
   VALIDAR NOMBRE
============================ */
function validarNombre(nombre) {

  if (!nombre) return false;

  // Limpiar espacios
  nombre = nombre.trim();

  if (nombre.length === 0) return false;

  // Máx 25 caracteres
  if (nombre.length > 25) return false;

  // Quitar HTML
  nombre = nombre.replace(/<[^>]*>?/gm, "");

  // Bloquear palabras peligrosas
  const bloqueadas = [
    "script",
    "select",
    "insert",
    "delete",
    "drop",
    "update",
    "union",
    "javascript:",
    "--",
    "/*",
    "*/",
    "<",
    ">"
  ];

  const lower = nombre.toLowerCase();

  for (const palabra of bloqueadas) {
    if (lower.includes(palabra)) return false;
  }

  // Solo letras/números/espacio
  const regex = /^[A-Za-z0-9áéíóúÁÉÍÓÚñÑ ]{3,25}$/;

  if (!regex.test(nombre)) return false;

  return nombre;
}

/* ============================
   OBTENER USUARIOS (LIBRE)
============================ */
router.get("/usuarios", async (req, res) => {
  try {

    const [rows] = await conexion.query(
      "SELECT pk_idusuario, nombre FROM usuarios"
    );

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

/* ============================
   CREAR USUARIO (ADMIN)
============================ */
router.post("/usuarios", verificarAdmin, async (req, res) => {
  try {

    /* ⏱ DELAY */
    if (!verificarDelay(req)) {
      return res.status(429).json({
        error: "Espera unos segundos antes de intentar de nuevo"
      });
    }

    let { nombre } = req.body;

    nombre = validarNombre(nombre);

    if (!nombre) {
      return res.status(400).json({
        error: "Nombre inválido: sin scripts, máx 25 caracteres"
      });
    }

    /* 🔒 BLOQUEAR DUPLICADOS */
    const [existe] = await conexion.query(
      "SELECT pk_idusuario FROM usuarios WHERE nombre = ?",
      [nombre]
    );

    if (existe.length > 0) {
      return res.status(400).json({
        error: "Ese nombre ya existe"
      });
    }

    await conexion.query(
      "INSERT INTO usuarios (nombre) VALUES (?)",
      [nombre]
    );

    res.json({ ok: true });

  } catch (err) {

    console.error(err);

    res.status(400).json({
      error: err.sqlMessage
    });
  }
});

/* ============================
   MODIFICAR USUARIO (ADMIN)
============================ */
router.put("/usuarios/:id", verificarAdmin, async (req, res) => {
  try {

    /* ⏱ DELAY */
    if (!verificarDelay(req)) {
      return res.status(429).json({
        error: "Espera unos segundos antes de intentar de nuevo"
      });
    }

    const { id } = req.params;
    let { nombre } = req.body;

    nombre = validarNombre(nombre);

    if (!nombre) {
      return res.status(400).json({
        error: "Nombre inválido: sin scripts, máx 25 caracteres"
      });
    }

    /* 🔒 BLOQUEAR DUPLICADOS */
    const [existe] = await conexion.query(
      "SELECT pk_idusuario FROM usuarios WHERE nombre = ? AND pk_idusuario != ?",
      [nombre, id]
    );

    if (existe.length > 0) {
      return res.status(400).json({
        error: "Ese nombre ya existe"
      });
    }

    await conexion.query(
      "UPDATE usuarios SET nombre = ? WHERE pk_idusuario = ?",
      [nombre, id]
    );

    res.json({ ok: true });

  } catch (err) {

    console.error(err);

    res.status(400).json({
      error: err.sqlMessage
    });
  }
});

/* ============================
   ELIMINAR USUARIO (ADMIN)
============================ */
router.delete("/usuarios/:id", verificarAdmin, async (req, res) => {
  try {

    /* ⏱ DELAY */
    if (!verificarDelay(req)) {
      return res.status(429).json({
        error: "Espera unos segundos antes de intentar de nuevo"
      });
    }

    const { id } = req.params;

    await conexion.query(
      "DELETE FROM usuarios WHERE pk_idusuario = ?",
      [id]
    );

    res.json({ ok: true });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Error al eliminar"
    });
  }
});

/* ============================
   PERMISOS (SOLO LECTURA)
============================ */
router.get("/permisos", async (req, res) => {
  try {

    const [rows] = await conexion.query(
      "SELECT rol FROM permisos LIMIT 1"
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: "Permiso no configurado"
      });
    }

    res.json(rows[0]);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Error al obtener permisos"
    });
  }
});

export default router;
