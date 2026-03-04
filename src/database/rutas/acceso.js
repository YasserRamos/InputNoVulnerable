import express from "express";
import conexion from "../conexionDB.js";
import { verificarAdmin } from "../Middlewares/verificarAdmin.js";

const router = express.Router();

/* ============================
    VALIDAR NOMBRE (PERMISIVO)
============================ */
function validarNombre(nombre) {
  if (!nombre) return false;
  nombre = nombre.trim();
  if (nombre.length === 0) return false;

  // Solo mantenemos la limpieza de HTML básica
  nombre = nombre.replace(/<[^>]*>?/gm, "");

  // Quitamos la lista de bloqueadas y la regex estricta 
  // para que acepte "Test_Ráfaga_1" y similares
  return nombre;
}

/* ============================
    OBTENER USUARIOS
============================ */
router.get("/usuarios", async (req, res) => {
  try {
    const [rows] = await conexion.query(
      "SELECT pk_idusuario, nombre FROM usuarios ORDER BY pk_idusuario DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

/* ============================
    CREAR USUARIO
============================ */
router.post("/usuarios", verificarAdmin, async (req, res) => {
  try {
    let { nombre } = req.body;
    nombre = validarNombre(nombre);

    if (!nombre) {
      return res.status(400).json({ error: "Nombre inválido" });
    }

    // ELIMINADO: Validación de "existe" para permitir ráfagas rápidas 
    // sin errores de duplicados durante la demo.

    await conexion.query(
      "INSERT INTO usuarios (nombre) VALUES (?)",
      [nombre]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Error al crear usuario" });
  }
});

/* ============================
    MODIFICAR USUARIO
============================ */
router.put("/usuarios/:id", verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    let { nombre } = req.body;

    nombre = validarNombre(nombre);
    if (!nombre) return res.status(400).json({ error: "Nombre inválido" });

    await conexion.query(
      "UPDATE usuarios SET nombre = ? WHERE pk_idusuario = ?",
      [nombre, id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Error al actualizar" });
  }
});

/* ============================
    ELIMINAR USUARIO
============================ */
router.delete("/usuarios/:id", verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await conexion.query(
      "DELETE FROM usuarios WHERE pk_idusuario = ?",
      [id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar" });
  }
});

router.get("/permisos", async (req, res) => {
  try {
    const [rows] = await conexion.query("SELECT rol FROM permisos LIMIT 1");
    if (rows.length === 0) return res.status(404).json({ error: "No config" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

export default router;