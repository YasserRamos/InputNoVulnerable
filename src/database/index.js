const axios = require("axios");
const { SocksProxyAgent } = require("socks-proxy-agent");
const net = require("net");

const agent = new SocksProxyAgent("socks5h://127.0.0.1:9050");

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

async function fetchIP() {
  try {
    const response = await axios.get("https://httpbin.org/ip", {
      httpAgent: agent,
      httpsAgent: agent,
    });

    console.log("IP vista por el servidor:", response.data);
  } catch (error) {
    console.log("Error en la petición:", error.message);
  }
}

const throttledRequest = throttle(fetchIP, 3000);

setInterval(() => {
  throttledRequest();
}, 500);

function renewCircuit() {
  const socket = net.connect(9051, "127.0.0.1", () => {
    socket.write('AUTHENTICATE ""\r\n');
    socket.write("SIGNAL NEWNYM\r\n");
    socket.write("QUIT\r\n");
  });

  socket.on("data", () => {
    console.log("Nuevo circuito solicitado");
  });
}

setInterval(() => {
  renewCircuit();
}, 20000);