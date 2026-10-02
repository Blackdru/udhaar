const { WebSocketServer } = require('ws');

let wss = null;
const clientSubscriptions = new Map(); // ws -> businessId

function initWebSocket(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'SUBSCRIBE' && data.businessId) {
          clientSubscriptions.set(ws, data.businessId);
          ws.send(JSON.stringify({ type: 'SUBSCRIBED', businessId: data.businessId }));
        }
      } catch (e) {
        // ignore malformed message
      }
    });

    ws.on('close', () => {
      clientSubscriptions.delete(ws);
    });

    ws.on('error', () => {
      clientSubscriptions.delete(ws);
    });
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });
}

function broadcastToBusiness(businessId, payload) {
  if (!wss) return;
  const message = JSON.stringify(payload);
  clientSubscriptions.forEach((subBizId, client) => {
    if (subBizId === businessId && client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}

module.exports = {
  initWebSocket,
  broadcastToBusiness
};
