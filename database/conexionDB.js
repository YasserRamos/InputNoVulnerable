// conexionDB.js
import mysql from "mysql2/promise";

const conexion = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// const conexion = await mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "yassy0127",
//   database: "crudprueba"
// });

console.log("📦 Conectado a MySQL correctamente");

export default conexion;
