//// server/index.js
//const express = require('express');
//const http = require('http');
//const WebSocket = require('ws');
//
//const app = express();
//const server = http.createServer(app);
//const wss = new WebSocket.Server({ server });
//
//const waitingUsers = [];
//const activeRooms = new Map();
//const path = require('path');
//
//function generateRoomId() {
//  return 'room-' + Math.random().toString(36).substring(2, 10);
//}
//
//wss.on('connection', (ws) => {
//  console.log('🟢 New user connected');
//
//  // Handle incoming messages
//  ws.on('message', (data) => {
//    let msg;
//    try {
//      msg = JSON.parse(data);
//    } catch (e) {
//      console.warn('⚠️ Invalid JSON received');
//      return;
//    }
//
//    if (msg.type === 'join' && typeof msg.username === 'string') {
//      const username = msg.username.trim();
//      if (!username) {
//        ws.send(JSON.stringify({ type: 'error', message: 'Username required' }));
//        return;
//      }
//
//      ws.username = username;
//      waitingUsers.push({ ws, username });
//      console.log(`👤 "${username}" joined waiting room (total: ${waitingUsers.length})`);
//
//      if (waitingUsers.length >= 2) {
//        const user1 = waitingUsers.shift();
//        const user2 = waitingUsers.shift();
//        const roomId = generateRoomId();
//
//        activeRooms.set(roomId, { user1, user2 });
//
//        user1.ws.send(JSON.stringify({ type: 'paired', partner: user2.username }));
//        user2.ws.send(JSON.stringify({ type: 'paired', partner: user1.username }));
//
//        console.log(`🔗 Paired "${user1.username}" ↔ "${user2.username}" in ${roomId}`);
//      } else {
//        ws.send(JSON.stringify({ type: 'waiting' }));
//      }
//    }
//
//    else if (msg.type === 'chat' && typeof msg.text === 'string') {
//      if (!ws.username) {
//        ws.send(JSON.stringify({ type: 'error', message: 'Join first' }));
//        return;
//      }
//
//      // 🔍 DEBUG: Log incoming message
//      console.log(`📨 Message from ${ws.username}: "${msg.text}"`);
//
//      let partnerWs = null;
//      for (const [roomId, room] of activeRooms) {
//        console.log(`🔍 Checking room ${roomId}: user1=${room.user1.username}, user2=${room.user2.username}`);
//        if (room.user1.ws === ws) {
//          partnerWs = room.user2.ws;
//          break;
//        }
//        if (room.user2.ws === ws) {
//          partnerWs = room.user1.ws;
//          break;
//        }
//      }
//
//      if (partnerWs && partnerWs.readyState === WebSocket.OPEN) {
//        console.log(`✅ Forwarding to ${partnerWs.username}`);
//        partnerWs.send(JSON.stringify({
//          type: 'chat',
//          from: ws.username,
//          text: msg.text.trim()
//        }));
//      } else {
//        console.log(`❌ NO PARTNER FOUND for ${ws.username}`);
//      }
//    }
//  }); // 👈 Closes ws.on('message')
//
//  // ✅ NOW CORRECTLY OUTSIDE message handler
//  ws.on('close', () => {
//    console.log('🔴 User disconnected');
//
//    const waitingIndex = waitingUsers.findIndex(u => u.ws === ws);
//    if (waitingIndex !== -1) {
//      const removed = waitingUsers.splice(waitingIndex, 1)[0];
//      console.log(`🗑️ Removed "${removed.username}" from waiting queue`);
//    }
//
//    for (const [roomId, room] of activeRooms) {
//      if (room.user1.ws === ws || room.user2.ws === ws) {
//        const partner = room.user1.ws === ws ? room.user2 : room.user1;
//        console.log(`💥 Room ${roomId} destroyed — "${ws.username}" left`);
//
//        if (partner.ws.readyState === WebSocket.OPEN) {
//          partner.ws.send(JSON.stringify({ type: 'partner-left' }));
//        }
//
//        activeRooms.delete(roomId);
//        break;
//      }
//    }
//  });
//
//  ws.on('error', (err) => {
//    console.error('WebSocket error:', err);
//  });
//});
//
//if (process.env.NODE_ENV === 'production') {
//  app.use(express.static(path.join(__dirname, 'client/dist')));
//  app.get('*', (req, res) => {
//    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
//  });
//}
//
////const PORT = process.env.PORT || 3000;
////server.listen(PORT, '0.0.0.0', () => {
////  console.log(`🚀 Fugue P2P server running on ws://localhost:${PORT}`);
////});
//const PORT = process.env.PORT || 3000;
//app.listen(PORT, '0.0.0.0', () => {
//  console.log(`Server running on port ${PORT}`);
//});
// server/index.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const waitingUsers = [];
const activeRooms = new Map();

function generateRoomId() {
  return 'room-' + Math.random().toString(36).substring(2, 10);
}

wss.on('connection', (ws) => {
  console.log('🟢 New user connected');

  // Handle incoming messages
  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch (e) {
      console.warn('⚠️ Invalid JSON received');
      return;
    }

    if (msg.type === 'join' && typeof msg.username === 'string') {
      const username = msg.username.trim();
      if (!username) {
        ws.send(JSON.stringify({ type: 'error', message: 'Username required' }));
        return;
      }

      ws.username = username;
      waitingUsers.push({ ws, username });
      console.log(`👤 "${username}" joined waiting room (total: ${waitingUsers.length})`);

      if (waitingUsers.length >= 2) {
        const user1 = waitingUsers.shift();
        const user2 = waitingUsers.shift();
        const roomId = generateRoomId();

        activeRooms.set(roomId, { user1, user2 });

        user1.ws.send(JSON.stringify({ type: 'paired', partner: user2.username }));
        user2.ws.send(JSON.stringify({ type: 'paired', partner: user1.username }));

        console.log(`🔗 Paired "${user1.username}" ↔ "${user2.username}" in ${roomId}`);
      } else {
        ws.send(JSON.stringify({ type: 'waiting' }));
      }
    }

    else if (msg.type === 'chat' && typeof msg.text === 'string') {
      if (!ws.username) {
        ws.send(JSON.stringify({ type: 'error', message: 'Join first' }));
        return;
      }

      console.log(`📨 Message from ${ws.username}: "${msg.text}"`);

      let partnerWs = null;
      for (const [roomId, room] of activeRooms) {
        if (room.user1.ws === ws) {
          partnerWs = room.user2.ws;
          break;
        }
        if (room.user2.ws === ws) {
          partnerWs = room.user1.ws;
          break;
        }
      }

      if (partnerWs && partnerWs.readyState === WebSocket.OPEN) {
        console.log(`✅ Forwarding to ${partnerWs.username}`);
        partnerWs.send(JSON.stringify({
          type: 'chat',
          from: ws.username,
          text: msg.text.trim()
        }));
      } else {
        console.log(`❌ NO PARTNER FOUND for ${ws.username}`);
      }
    }
  });

  ws.on('close', () => {
    console.log('🔴 User disconnected');

    const waitingIndex = waitingUsers.findIndex(u => u.ws === ws);
    if (waitingIndex !== -1) {
      const removed = waitingUsers.splice(waitingIndex, 1)[0];
      console.log(`🗑️ Removed "${removed.username}" from waiting queue`);
    }

    for (const [roomId, room] of activeRooms) {
      if (room.user1.ws === ws || room.user2.ws === ws) {
        const partner = room.user1.ws === ws ? room.user2 : room.user1;
        console.log(`💥 Room ${roomId} destroyed — "${ws.username}" left`);

        if (partner.ws.readyState === WebSocket.OPEN) {
          partner.ws.send(JSON.stringify({ type: 'partner-left' }));
        }

        activeRooms.delete(roomId);
        break;
      }
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

// Serve static files in production ONLY if they exist
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, 'client/dist');

  // Only serve static files if the directory exists
  const fs = require('fs');
  if (fs.existsSync(clientPath)) {
    app.use(express.static(clientPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientPath, 'index.html'));
    });
    console.log('✅ Serving React client from:', clientPath);
  } else {
    console.log('⚠️  No React client found, serving API only');

    // Serve a simple HTML page for the root route
    app.get('/', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Fugue P2P Chat</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .container { max-width: 800px; margin: 0 auto; }
                .status { padding: 10px; background: #f0f0f0; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 Fugue P2P Chat Server</h1>
                <div class="status">
                    <p><strong>Status:</strong> ✅ Server is running</p>
                    <p><strong>WebSocket:</strong> Ready for connections</p>
                    <p><strong>Port:</strong> ${process.env.PORT || 8080}</p>
                </div>
                <p>This is a WebSocket server for the Fugue P2P chat application.</p>
                <p>Connect to the WebSocket endpoint to use the chat functionality.</p>
                <p><em>No React client is deployed. This server provides the WebSocket API only.</em></p>
            </div>
        </body>
        </html>
      `);
    });
  }
} else {
  // Development - simple root route
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Fugue P2P Chat - Development</title>
      </head>
      <body>
          <h1>🚀 Fugue P2P Chat Server (Development)</h1>
          <p>WebSocket server is running on port ${process.env.PORT || 8080}</p>
          <p>Connect to ws://localhost:${process.env.PORT || 8080} to use the WebSocket API</p>
      </body>
      </html>
    `);
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Fugue P2P Chat',
    timestamp: new Date().toISOString(),
    websocket: 'active'
  });
});

// Use Cloud Run's PORT or default to 8080
const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Fugue P2P server running on port ${PORT}`);
  console.log(`WebSocket server: ws://localhost:${PORT}`);
});