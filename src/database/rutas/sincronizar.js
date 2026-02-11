import express from "express";
import cors from "cors";
import conexion from "../conexionDB.js";

const router = express.Router();
router.use(cors());

/* ===============================
   OBTENER TODOS LOS USUARIOS
=============================== */
router.get("/usuarios", async (req, res) => {
  try {
    const [rows] = await conexion.query(
      "SELECT pk_idusuario, nombre FROM usuarios"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

/* ===============================
   CREAR USUARIO
=============================== */
router.post("/usuarios", async (req, res) => {
  try {
    const { nombre } = req.body;

    await conexion.query(
      "INSERT INTO usuarios (nombre) VALUES (?)",
      [nombre]
    );

    res.json({ ok: true, msg: "Usuario creado" });
  } catch (err) {
    console.error("Error al crear usuario:", err);
    res.status(400).json({
      error: err.sqlMessage || "Datos inválidos",
    });
  }
});

/* ===============================
   ACTUALIZAR USUARIO
=============================== */
router.put("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    await conexion.query(
      "UPDATE usuarios SET nombre = ? WHERE pk_idusuario = ?",
      [nombre, id]
    );

    res.json({ ok: true, msg: "Usuario actualizado" });
  } catch (err) {
    console.error("Error al actualizar usuario:", err);
    res.status(400).json({
      error: err.sqlMessage || "Datos inválidos",
    });
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
    console.error("Error al eliminar usuario:", err);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});

/* ===============================
   PERMISOS (SOLO LECTURA)
=============================== */
router.get("/permisos", async (req, res) => {
  try {
    const [rows] = await conexion.query(
      "SELECT rol FROM permisos LIMIT 1"
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Permisos no configurados" });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error("Error al obtener permisos:", err);
    res.status(500).json({ error: "Error al obtener permisos" });
  }
});

export default router;
