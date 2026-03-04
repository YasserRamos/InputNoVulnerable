import express from "express";
import cors from "cors";
import conexion from "../conexionDB.js";

const router = express.Router();
router.use(cors());

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

  // Bloqueo palabras peligrosas (Blacklist)
  const bloqueadas = [
    "select", "insert", "update", "delete", "drop", "truncate", "alter", "create", 
    "replace", "rename", "grant", "revoke", "commit", "rollback", "savepoint", 
    "union", "having", "where", "order by", "group by", "limit", "offset", 
    "benchmark", "sleep", "load_file", "outfile", "into outfile", 
    "information_schema", "table_schema", "database()", "version()",
    "--", "#", "/*", "*/",
    "' or ", "\" or ", "' and ", "\" and ", " or 1=1", " or '1'='1", " or \"1\"=\"1",
    "<script", "</script>", "javascript:", "onerror", "onload", "onclick", 
    "onmouseover", "alert(", "prompt(", "confirm(", "<img", "<iframe", "<svg", 
    "<object", "<embed", "<link", "<style", "<meta",
    "<", ">", "&lt;", "&gt;",
    "require(", "process.", "eval(", "child_process", "fs.", "exec(",
    "http://", "https://", "data:", "base64", "%27", "%22", "%3c", "%3e"
  ];

  const lower = nombre.toLowerCase();
  for (const palabra of bloqueadas) {
    if (lower.includes(palabra)) return false;
  }

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
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

/* ===============================
   CREAR USUARIO
=============================== */
router.post("/usuarios", async (req, res) => {
  try {
    let { nombre } = req.body;
    nombre = validarNombre(nombre);

    if (!nombre) {
      return res.status(400).json({
        error: "Nombre inválido (3-25 caracteres, sin scripts)"
      });
    }

    const [existe] = await conexion.query(
      "SELECT pk_idusuario FROM usuarios WHERE nombre = ?",
      [nombre]
    );

    if (existe.length > 0) {
      return res.status(400).json({ error: "Ese nombre ya existe" });
    }

    await conexion.query(
      "INSERT INTO usuarios (nombre) VALUES (?)",
      [nombre]
    );

    res.json({ ok: true, msg: "Usuario creado" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Error al crear usuario" });
  }
});

/* ===============================
   ACTUALIZAR USUARIO
=============================== */
router.put("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let { nombre } = req.body;

    nombre = validarNombre(nombre);
    if (!nombre) {
      return res.status(400).json({ error: "Nombre inválido" });
    }

    const [existe] = await conexion.query(
      "SELECT pk_idusuario FROM usuarios WHERE nombre = ? AND pk_idusuario != ?",
      [nombre, id]
    );

    if (existe.length > 0) {
      return res.status(400).json({ error: "Ese nombre ya existe" });
    }

    await conexion.query(
      "UPDATE usuarios SET nombre = ? WHERE pk_idusuario = ?",
      [nombre, id]
    );

    res.json({ ok: true, msg: "Usuario actualizado" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Error al actualizar" });
  }
});

/* ===============================
   ELIMINAR USUARIO
=============================== */
router.delete("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await conexion.query(
      "DELETE FROM usuarios WHERE pk_idusuario = ?",
      [id]
    );
    res.json({ ok: true, msg: "Usuario eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar usuario" });
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
      return res.status(404).json({ error: "Permisos no configurados" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener permisos" });
  }
});

export default router;