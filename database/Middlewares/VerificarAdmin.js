import conexion from "../conexionDB.js";

export async function VerificarAdmin(req, res, next) {

  const [rows] = await conexion.query(
    "SELECT rol FROM permisos LIMIT 1"
  );

  if (rows[0].rol !== "admin") {
    return res.status(403).json({
      error: "Sistema en modo lectura"
    });
  }

  next();
}
