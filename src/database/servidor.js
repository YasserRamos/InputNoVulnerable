// servidor.js
import express from "express";
import acceso from "./rutas/acceso.js";
import rutaSync from "./rutas/sincronizar.js";
import cors from "cors";

const PORT = process.env.PORT || 3002;

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", acceso);
app.use("/api/sync", rutaSync);

app.get("/api/prueba", (req, res) => {
  res.send("🚀 Servidor funcionando correctamente");
});

app.listen(PORT, () => {
  console.log("🌐 Backend corriendo en el puerto 3002 usando el proxy 47410");
});
