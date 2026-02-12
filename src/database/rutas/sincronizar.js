import express from "express";
import cors from "cors";
import conexion from "../conexionDB.js";
import rateLimit from "express-rate-limit";

const router = express.Router();
router.use(cors());

/* ===============================
   RATE LIMIT (ANTI-DDOS)
=============================== */
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 min
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiadas solicitudes. Intenta más tarde."
  }
});

router.use(limiter);

/* ===============================
   DELAY ANTI-SPAM
=============================== */
const ultimasPeticiones = new Map();
const DELAY_MS = 3000;

function verificarDelay(req) {

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress;

  const ahora = Date.now();

  const ultima = ultimasPeticiones.get(ip) || 0;

  if (ahora - ultima < DELAY_MS) return false;

  ultimasPeticiones.set(ip, ahora);

  setTimeout(() => {
    ultimasPeticiones.delete(ip);
  }, DELAY_MS * 3);

  return true;
}

/* ===============================
   VALIDAR NOMBRE
=============================== */
function validarNombre(nombre) {

  if (!nombre) return false;

  nombre = nombre.trim();

  if (nombre.length < 3) return false;
  if (nombre.length > 25) return false;

  // Eliminar HTML
  nombre = nombre.replace(/<[^>]*>?/gm, "");

  // Bloqueo palabras peligrosas
const bloqueadas = [

  // =========================
  // SQL Injection
  // =========================
  "select",
  "insert",
  "update",
  "delete",
  "drop",
  "truncate",
  "alter",
  "create",
  "replace",
  "rename",
  "grant",
  "revoke",
  "commit",
  "rollback",
  "savepoint",
  "union",
  "having",
  "where",
  "order by",
  "group by",
  "limit",
  "offset",
  "benchmark",
  "sleep",
  "load_file",
  "outfile",
  "into outfile",
  "information_schema",
  "table_schema",
  "database()",
  "version()",

  // =========================
  // Comentarios SQL
  // =========================
  "--",
  "#",
  "/*",
  "*/",

  // =========================
  // Operadores sospechosos
  // =========================
  "' or ",
  "\" or ",
  "' and ",
  "\" and ",
  " or 1=1",
  " or '1'='1",
  " or \"1\"=\"1",

  // =========================
  // XSS
  // =========================
  "<script",
  "</script>",
  "javascript:",
  "onerror",
  "onload",
  "onclick",
  "onmouseover",
  "alert(",
  "prompt(",
  "confirm(",
  "<img",
  "<iframe",
  "<svg",
  "<object",
  "<embed",
  "<link",
  "<style",
  "<meta",

  // =========================
  // HTML peligroso
  // =========================
  "<",
  ">",
  "&lt;",
  "&gt;",

  // =========================
  // Node / JS ejecución
  // =========================
  "require(",
  "process.",
  "eval(",
  "child_process",
  "fs.",
  "exec(",

  // =========================
  // Misc peligrosos
  // =========================
  "http://",
  "https://",
  "data:",
  "base64",
  "%27",     // '
  "%22",     // "
  "%3c",     // <
  "%3e",     // >
];


  const lower = nombre.toLowerCase();

  for (const palabra of bloqueadas) {
    if (lower.includes(palabra)) return false;
  }

  // Solo letras/números/espacio
  const regex = /^[A-Za-z0-9áéíóúÁÉÍÓÚñÑ ]+$/;

  if (!regex.test(nombre)) return false;

  return nombre;
}

/* ===============================
   OBTENER USUARIOS
=============================== */
router.get("/usuarios", async (req, res) => {
  try {

    const [rows] = await conexion.query(
      "SELECT pk_idusuario, nombre FROM usuarios"
    );

    res.json(rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Error al obtener usuarios"
    });
  }
});

/* ===============================
   CREAR USUARIO
=============================== */
router.post("/usuarios", async (req, res) => {
  try {

    if (!verificarDelay(req)) {
      return res.status(429).json({
        error: "Espera unos segundos"
      });
    }

    let { nombre } = req.body;

    nombre = validarNombre(nombre);

    if (!nombre) {
      return res.status(400).json({
        error: "Nombre inválido (3-25 caracteres, sin scripts)"
      });
    }

    // Bloquear duplicados
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

    res.json({
      ok: true,
      msg: "Usuario creado"
    });

  } catch (err) {

    console.error(err);

    res.status(400).json({
      error: "Error al crear usuario"
    });
  }
});

/* ===============================
   ACTUALIZAR USUARIO
=============================== */
router.put("/usuarios/:id", async (req, res) => {
  try {

    if (!verificarDelay(req)) {
      return res.status(429).json({
        error: "Espera unos segundos"
      });
    }

    const { id } = req.params;
    let { nombre } = req.body;

    nombre = validarNombre(nombre);

    if (!nombre) {
      return res.status(400).json({
        error: "Nombre inválido"
      });
    }

    // Anti-duplicados
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

    res.json({
      ok: true,
      msg: "Usuario actualizado"
    });

  } catch (err) {

    console.error(err);

    res.status(400).json({
      error: "Error al actualizar"
    });
  }
});

/* ===============================
   ELIMINAR USUARIO
=============================== */
router.delete("/usuarios/:id", async (req, res) => {
  try {

    if (!verificarDelay(req)) {
      return res.status(429).json({
        error: "Espera unos segundos"
      });
    }

    const { id } = req.params;

    await conexion.query(
      "DELETE FROM usuarios WHERE pk_idusuario = ?",
      [id]
    );

    res.json({
      ok: true,
      msg: "Usuario eliminado"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Error al eliminar usuario"
    });
  }
});

/* ===============================
   PERMISOS
=============================== */
router.get("/permisos", async (req, res) => {
  try {

    const [rows] = await conexion.query(
      "SELECT rol FROM permisos LIMIT 1"
    );

    if (!rows.length) {
      return res.status(404).json({
        error: "Permisos no configurados"
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
