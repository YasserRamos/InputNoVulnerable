import express from "express";
import conexion from "../conexionDB.js";
import { verificarAdmin } from "../Middlewares/verificarAdmin.js";

const router = express.Router();

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
    const { nombre } = req.body;

    await conexion.query(
      "INSERT INTO usuarios (nombre) VALUES (?)",
      [nombre]
    );

    res.json({ ok: true });

  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.sqlMessage });
  }
});

/* ============================
   MODIFICAR USUARIO (ADMIN)
============================ */
router.put("/usuarios/:id", verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    await conexion.query(
      "UPDATE usuarios SET nombre = ? WHERE pk_idusuario = ?",
      [nombre, id]
    );

    res.json({ ok: true });

  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.sqlMessage });
  }
});

/* ============================
   ELIMINAR USUARIO (ADMIN)
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

/* ============================
   PERMISOS (SOLO LECTURA)
============================ */
router.get("/permisos", async (req, res) => {
  try {

    const [rows] = await conexion.query(
      "SELECT rol FROM permisos LIMIT 1"
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Permiso no configurado" });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener permisos" });
  }
});

export default router;
