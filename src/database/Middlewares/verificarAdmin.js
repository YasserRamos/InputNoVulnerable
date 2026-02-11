import conexion from "../conexionDB.js";

/* ============================
   CACHE SIMPLE EN MEMORIA
============================ */

let cacheRol = null;
let cacheTime = 0;

const CACHE_TTL = 60 * 1000; // 1 minuto

export async function verificarAdmin(req, res, next) {
  try {
    const ahora = Date.now();

    /* ============================
       USAR CACHE SI AÚN ES VÁLIDO
    ============================ */
    if (cacheRol && ahora - cacheTime < CACHE_TTL) {

      if (cacheRol !== "admin") {
        return res.status(403).json({
          error: "Sistema en modo lectura"
        });
      }

      return next();
    }

    /* ============================
       CONSULTAR DB (SI NO HAY CACHE)
    ============================ */
    const [rows] = await conexion.query(
      "SELECT rol FROM permisos LIMIT 1"
    );

    if (!rows || rows.length === 0) {
      return res.status(500).json({
        error: "Permisos no configurados"
      });
    }

    // Guardar en cache
    cacheRol = rows[0].rol;
    cacheTime = ahora;

    if (cacheRol !== "admin") {
      return res.status(403).json({
        error: "Sistema en modo lectura"
      });
    }

    next();

  } catch (error) {

    console.error("Error en verificarAdmin:", error);

    return res.status(500).json({
      error: "Error al validar permisos"
    });
  }
}
