import { Server } from "node-osc";
import { WebSocketServer } from "ws";
import os from "os";

const OSC_PORT = 12345; // Emotibit sends to this port
const WS_PORT = 3001;   // Frontend connects to this port

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-ipv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const localIP = getLocalIP();

console.log(`\n================================`);
console.log(`🚀 Emotibit Bridge Starting...`);
console.log(`================================`);
console.log(`1. Frontend WebSocket: ws://localhost:${WS_PORT}`);
console.log(`2. OSC Listening Port: ${OSC_PORT}`);
console.log(`   👉 Your Computer IP is: ${localIP}`);
console.log(`   (Make sure Emotibit sends data to ${localIP} port ${OSC_PORT})`);
console.log(`================================\n`);

// 1. Create WebSocket Server
const wss = new WebSocketServer({ port: WS_PORT });

wss.on("connection", (ws) => {
  console.log("✅ CHECK: Frontend connected to WebSocket!");
  ws.send(JSON.stringify({ type: "STATUS", connected: true }));
});

// 2. Create OSC Server
const oscServer = new Server(OSC_PORT, "0.0.0.0", () => {
  console.log(`Bridge is ready and listening... Waiting for data...`);
});

oscServer.on("message", (msg) => {
  // OSC msg format: ['/Emotibit/0/PPG:RED', 12345, 3.3]
  const [address, ...args] = msg;
  
  // Debug log: Print EVERYTHING to be sure we are getting signals
  console.log(`Received OSC: ${address}`, args); 

  // Clean tag (e.g. "/Emotibit/0/PPG:RED" -> "PPG:RED")
  const tagParts = address.split("/");
  const tag = tagParts[tagParts.length - 1];

  const payload = {
    type: "DATA",
    tag: tag,
    data: args,
    timestamp: Date.now()
  };

  // Broadcast to all connected clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(payload));
    }
  });
});

oscServer.on("error", (err) => {
  console.error("❌ OSC Error:", err);
});
