import mysql from "mysql2/promise";
import rateLimit from "express-rate-limit";

app.use(limiter);

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
console.log("ENV:", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  db: process.env.DB_NAME,
  port: process.env.DB_PORT,
});


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Demasiadas peticiones, intenta más tarde"
});



export default conexion;
