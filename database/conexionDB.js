// conexionDB.js
import mysql from "mysql2/promise";

const conexion = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "yassy0127", // cámbialo si tienes contraseña
  database: "crudprueba" // cambia esto por tu base real
});

console.log("📦 Conectado a MySQL correctamente");

export default conexion;
