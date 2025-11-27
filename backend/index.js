require('dotenv').config();

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);

const {
  pool,
  ensureSchema,
  createUser,
  findUserByUsername,
  findUserById,
  verifyPassword,
  listInterests,
  getUserInterests,
  replaceUserInterests
} = require('./db');

const app = express();
const server = http.createServer(app);

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const sessionMiddleware = session({
  store: new PgSession({
    pool,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET || 'dev-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    sameSite: 'lax',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
});

app.use(express.json());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

app.use(sessionMiddleware);

// Health check endpoint for CI/CD
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'fugue-backend',
    version: process.env.npm_package_version || '1.0.0'
  });
});

const interestCache = new Map();

async function refreshInterestCache() {
  const interests = await listInterests();
  interestCache.clear();
  interests.forEach((interest) => {
    interestCache.set(interest.id, interest.name);
  });
}

function sanitizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

function safeUserPayload(user) {
  if (!user) return null;
  return { id: user.id, username: user.username };
}

app.post('/api/signup', async (req, res) => {
  try {
    const usernameRaw = req.body?.username;
    const password = req.body?.password;

    if (!usernameRaw || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const username = sanitizeUsername(usernameRaw);
    if (username.length < 3 || username.length > 32) {
      return res.status(400).json({ error: 'Username must be between 3 and 32 characters.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existing = await findUserByUsername(username);
    if (existing) {
      return res.status(409).json({ error: 'Username already taken.' });
    }

    const user = await createUser(username, password);
    req.session.userId = user.id;
    const interests = await getUserInterests(user.id);

    res.status(201).json({
      user: safeUserPayload(user),
      interests
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Unable to complete signup right now.' });
  }
});

app.get('/api/signup', (req, res) => {
  res.status(405).json({
    error: 'Use POST /api/signup with JSON body {"username","password"} to create an account.'
  });
});

app.post('/api/login', async (req, res) => {
  try {
    const usernameRaw = req.body?.username;
    const password = req.body?.password;

    if (!usernameRaw || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const username = sanitizeUsername(usernameRaw);
    const user = await findUserByUsername(username);

    const valid = await verifyPassword(user, password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    req.session.userId = user.id;
    const interests = await getUserInterests(user.id);

    res.json({
      user: safeUserPayload(user),
      interests
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Unable to login right now.' });
  }
});

app.get('/api/login', (req, res) => {
  res.status(405).json({
    error: 'Use POST /api/login with JSON body {"username","password"} to sign in.'
  });
});

app.post('/api/logout', (req, res) => {
  if (!req.session) {
    return res.status(200).json({ ok: true });
  }

  req.session.destroy((err) => {
    if (err) {
      console.error('Failed to destroy session', err);
      return res.status(500).json({ error: 'Failed to logout.' });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ ok: true });
  });
});

app.get('/api/me', async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const user = await findUserById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const interests = await getUserInterests(user.id);
    res.json({
      user: safeUserPayload(user),
      interests
    });
  } catch (error) {
    console.error('Fetch session user error:', error);
    res.status(500).json({ error: 'Unable to load user session.' });
  }
});

app.get('/api/interests', async (req, res) => {
  try {
    const interests = await listInterests();
    res.json({ interests });
  } catch (error) {
    console.error('List interests error:', error);
    res.status(500).json({ error: 'Unable to load interests.' });
  }
});

app.post('/api/user/interests', async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const interestIds = Array.isArray(req.body?.interestIds) ? req.body.interestIds : [];
    await replaceUserInterests(req.session.userId, interestIds);
    const updated = await getUserInterests(req.session.userId);
    res.json({ interests: updated });
  } catch (error) {
    console.error('Update interests error:', error);
    res.status(500).json({ error: 'Unable to update interests.' });
  }
});

const waitingByInterest = new Map(); // interestId -> [{ ws, userId }]
const generalWaiting = []; // [{ ws, userId }]
const activeRooms = new Map(); // roomId -> { user1, user2, interestId }
let roomCounter = 1;

function generateRoomId() {
  return `room-${roomCounter++}`;
}

function removeFromQueues(ws) {
  if (ws.currentQueue === 'interest' && ws.currentInterestId) {
    const queue = waitingByInterest.get(ws.currentInterestId);
    if (queue) {
      const idx = queue.findIndex((entry) => entry.ws === ws);
      if (idx >= 0) {
        queue.splice(idx, 1);
        if (queue.length === 0) {
          waitingByInterest.delete(ws.currentInterestId);
        }
      }
    }
  }
  if (ws.currentQueue === 'general') {
    const idx = generalWaiting.findIndex((entry) => entry.ws === ws);
    if (idx >= 0) {
      generalWaiting.splice(idx, 1);
    }
  }
  ws.currentQueue = null;
  ws.currentInterestId = null;
}

function notifyWaiting(ws, { message, queue, interestId, canExtend }) {
  ws.send(
    JSON.stringify({
      type: 'waiting',
      queue,
      interestId,
      interestName: interestId ? interestCache.get(interestId) || null : null,
      canExtend,
      message
    })
  );
}

function startRoom(entryA, entryB, interestId, reason) {
  const roomId = generateRoomId();
  activeRooms.set(roomId, {
    roomId,
    interestId: interestId || null,
    user1: entryA,
    user2: entryB
  });

  entryA.ws.roomId = roomId;
  entryB.ws.roomId = roomId;

  entryA.ws.currentQueue = null;
  entryB.ws.currentQueue = null;
  entryA.ws.currentInterestId = null;
  entryB.ws.currentInterestId = null;

  const interestName = interestId ? interestCache.get(interestId) || null : null;

  entryA.ws.send(
    JSON.stringify({
      type: 'paired',
      partner: entryB.username,
      roomId,
      interestId,
      interestName,
      reason
    })
  );
  entryB.ws.send(
    JSON.stringify({
      type: 'paired',
      partner: entryA.username,
      roomId,
      interestId,
      interestName,
      reason
    })
  );
}

function attemptInterestMatch(interestId, entry) {
  const queue = waitingByInterest.get(interestId);
  if (queue && queue.length > 0) {
    const partner = queue.shift();
    if (queue.length === 0) {
      waitingByInterest.delete(interestId);
    }
    startRoom(partner, entry, interestId, 'interest');
    return true;
  }
  return false;
}

function attemptGeneralMatch(entry) {
  if (generalWaiting.length > 0) {
    const partner = generalWaiting.shift();
    startRoom(partner, entry, null, 'extended');
    return true;
  }
  return false;
}

const wss = new WebSocket.Server({
  noServer: true,
  clientTracking: true,
  perMessageDeflate: false
});

server.on('upgrade', (request, socket, head) => {
  sessionMiddleware(request, {}, async () => {
    if (!request.session?.userId) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    const user = await findUserById(request.session.userId);
    if (!user) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    request.user = user;

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });
});

wss.on('connection', (ws, request) => {
  const user = request.user;
  ws.userId = user.id;
  ws.username = user.username;
  ws.currentQueue = null;
  ws.currentInterestId = null;
  ws.roomId = null;

  console.log(`🟢 WebSocket connected for user ${user.username}`);

  ws.on('message', async (data) => {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message payload' }));
      return;
    }

    if (msg.type === 'join') {
      if (ws.roomId) {
        ws.send(JSON.stringify({ type: 'error', message: 'You are already in a room.' }));
        return;
      }

      const interestId = Number(msg.interestId);
      if (!Number.isInteger(interestId)) {
        ws.send(JSON.stringify({ type: 'error', message: 'Interest selection is required.' }));
        return;
      }

      const userInterests = await getUserInterests(ws.userId);
      const allowedInterestIds = userInterests.map((i) => i.id);
      if (!allowedInterestIds.includes(interestId)) {
        ws.send(JSON.stringify({ type: 'error', message: 'Interest not configured for this user.' }));
        return;
      }

      removeFromQueues(ws);
      const entry = { ws, userId: ws.userId, username: ws.username };

      const matched = attemptInterestMatch(interestId, entry);
      if (!matched) {
        const queue = waitingByInterest.get(interestId) || [];
        queue.push(entry);
        waitingByInterest.set(interestId, queue);
        ws.currentQueue = 'interest';
        ws.currentInterestId = interestId;

        notifyWaiting(ws, {
          message: 'No one else is waiting on that interest right now.',
          queue: 'interest',
          interestId,
          canExtend: true
        });
      }
      return;
    }

    if (msg.type === 'extend-search') {
      if (ws.roomId) {
        ws.send(JSON.stringify({ type: 'error', message: 'Already chatting.' }));
        return;
      }

      const entry = { ws, userId: ws.userId, username: ws.username };
      const interestId = ws.currentInterestId;
      removeFromQueues(ws);

      const matched = attemptGeneralMatch(entry);
      if (!matched) {
        generalWaiting.push(entry);
        ws.currentQueue = 'general';
        notifyWaiting(ws, {
          message: 'Extended search... we will connect you with anyone available.',
          queue: 'general',
          interestId,
          canExtend: false
        });
      }
      return;
    }

    if (msg.type === 'cancel-waiting') {
      removeFromQueues(ws);
      ws.send(JSON.stringify({ type: 'waiting-cancelled' }));
      return;
    }

    if (msg.type === 'chat' && typeof msg.text === 'string') {
      if (!ws.roomId) {
        ws.send(JSON.stringify({ type: 'error', message: 'Join a room before chatting.' }));
        return;
      }

      const room = activeRooms.get(ws.roomId);
      if (!room) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room not found.' }));
        return;
      }

      const partner = room.user1.ws === ws ? room.user2 : room.user1;
      if (partner.ws.readyState === WebSocket.OPEN) {
        partner.ws.send(
          JSON.stringify({
            type: 'chat',
            from: ws.username,
            text: msg.text.trim()
          })
        );
      } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Partner disconnected.' }));
      }
      return;
    }

    if (msg.type === 'leave-room') {
      if (!ws.roomId) {
        ws.send(JSON.stringify({ type: 'error', message: 'You are not in a room.' }));
        return;
      }

      const room = activeRooms.get(ws.roomId);
      if (!room) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room not found.' }));
        return;
      }

      const partner = room.user1.ws === ws ? room.user2 : room.user1;
      activeRooms.delete(ws.roomId);
      ws.roomId = null;
      removeFromQueues(ws);
      ws.send(
        JSON.stringify({
          type: 'left-room',
          message: 'You left the chat.'
        })
      );

      if (partner.ws.readyState === WebSocket.OPEN) {
        partner.ws.roomId = null;
        partner.ws.send(
          JSON.stringify({
            type: 'partner-left'
          })
        );
      }
      return;
    }

    ws.send(JSON.stringify({ type: 'error', message: 'Unknown action.' }));
  });

  ws.on('close', () => {
    console.log(`🔴 WebSocket closed for ${ws.username}`);
    removeFromQueues(ws);

    if (ws.roomId) {
      const room = activeRooms.get(ws.roomId);
      if (room) {
        const partner = room.user1.ws === ws ? room.user2 : room.user1;
        activeRooms.delete(ws.roomId);
        if (partner.ws.readyState === WebSocket.OPEN) {
          partner.ws.roomId = null;
          partner.ws.send(JSON.stringify({ type: 'partner-left' }));
          notifyWaiting(partner.ws, {
            message: 'Your partner left the chat.',
            queue: null,
            interestId: null,
            canExtend: false
          });
        }
      }
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

// ============================================================================
// HEALTH CHECK & API INFO ENDPOINTS
// ============================================================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Fugue Chat API',
    timestamp: new Date().toISOString(),
    websocket: 'active',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Fugue Chat API',
    timestamp: new Date().toISOString(),
    websocket: 'active',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/websocket-info', (req, res) => {
  res.json({
    websocket_url: `wss://${req.get('host')}/ws`,
    supported_actions: ['join', 'extend-search', 'chat', 'leave-room', 'cancel-waiting'],
    active_connections: wss.clients.size,
    waiting_interest_queues: Array.from(waitingByInterest.entries()).map(([interestId, queue]) => ({
      interestId,
      interestName: interestCache.get(interestId) || 'Unknown',
      size: queue.length
    })),
    general_waiting: generalWaiting.length,
    active_rooms: activeRooms.size
  });
});

// 404 for undefined API routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: [
      'GET /health',
      'GET /api/health',
      'POST /api/signup',
      'POST /api/login',
      'POST /api/logout',
      'GET /api/me',
      'GET /api/interests',
      'POST /api/user/interests',
      'GET /websocket-info'
    ]
  });
});

// ============================================================================
// SERVER INITIALIZATION
// ============================================================================

let isReady = false;

const PORT = process.env.PORT || 8080;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Fugue Chat API server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);

  ensureSchema()
    .then(refreshInterestCache)
    .then(() => {
      isReady = true;
      console.log('✅ Database initialized and ready');
      console.log(`✅ Server ready at http://0.0.0.0:${PORT}`);
    })
    .catch((error) => {
      console.error('❌ Database initialization failed:', error);
      process.exit(1);
    });
});