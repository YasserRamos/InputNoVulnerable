const axios = require("axios");
const { SocksProxyAgent } = require("socks-proxy-agent");
const net = require("net");

// Proxy Tor local
const agent = new SocksProxyAgent("socks5h://127.0.0.1:9050");

// -------- THROTTLE --------
function throttle(func, limit) {
  let lastCall = 0;

  return async function (...args) {
    const now = Date.now();

    if (now - lastCall >= limit) {
      lastCall = now;
      return await func(...args);
    } else {
      console.log("Bloqueado por throttling");
    }
  };
}

// -------- PETICIÓN POR TOR --------
async function fetchIP() {
  try {
    const response = await axios.get("https://httpbin.org/ip", {
      httpAgent: agent,
      httpsAgent: agent,
    });

    console.log("IP vista por el servidor:", response.data);
  } catch (error) {
    console.log("Error en la petición");
  }
}

// Aplicamos throttle (1 petición cada 3 segundos)
const throttledRequest = throttle(fetchIP, 3000);

// Simulamos intentos cada 500 ms
setInterval(() => {
  throttledRequest();
}, 500);

// -------- CAMBIO DE CIRCUITO (NUEVO SALTO) --------
function renewCircuit() {
  const socket = net.connect(9051, "127.0.0.1", () => {
    socket.write('AUTHENTICATE ""\r\n');
    socket.write("SIGNAL NEWNYM\r\n");
    socket.write("QUIT\r\n");
  });

  socket.on("data", data => {
    console.log("Nuevo circuito solicitado");
  });
}

// Cambiar circuito cada 20 segundos
setInterval(() => {
  renewCircuit();
}, 20000);