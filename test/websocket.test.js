// WebSocket Integration Test
const { spawn } = require('child_process');
const WebSocket = require('ws');

const PORT = process.env.PORT || '8080';
const START_TIMEOUT = 10000;

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function probeHealth(timeoutMs = START_TIMEOUT) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/health`);
      if (res.ok) return true;
    } catch (e) {
      // Server not ready yet
    }
    await wait(500);
  }
  return false;
}

async function testWebSocketConnection() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${PORT}`);

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('WebSocket connection timeout'));
    }, 5000);

    ws.on('open', () => {
      console.log('✅ WebSocket connected');
      clearTimeout(timeout);

      // Send join message
      ws.send(JSON.stringify({ type: 'join', username: 'test-user' }));
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      console.log('📨 Received message:', msg);

      if (msg.type === 'waiting' || msg.type === 'paired') {
        console.log('✅ WebSocket functionality working');
        ws.close();
        resolve();
      }
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    ws.on('close', () => {
      clearTimeout(timeout);
    });
  });
}

async function testWebSocketPairing() {
  return new Promise((resolve, reject) => {
    const ws1 = new WebSocket(`ws://127.0.0.1:${PORT}`);
    const ws2 = new WebSocket(`ws://127.0.0.1:${PORT}`);

    let paired = 0;
    const timeout = setTimeout(() => {
      ws1.close();
      ws2.close();
      reject(new Error('Pairing timeout'));
    }, 10000);

    const checkPaired = () => {
      if (paired === 2) {
        clearTimeout(timeout);
        console.log('✅ WebSocket pairing successful');
        ws1.close();
        ws2.close();
        resolve();
      }
    };

    ws1.on('open', () => {
      ws1.send(JSON.stringify({ type: 'join', username: 'user1' }));
    });

    ws2.on('open', () => {
      ws2.send(JSON.stringify({ type: 'join', username: 'user2' }));
    });

    ws1.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'paired') {
        paired++;
        checkPaired();
      }
    });

    ws2.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'paired') {
        paired++;
        checkPaired();
      }
    });

    ws1.on('error', reject);
    ws2.on('error', reject);
  });
}

(async () => {
  console.log('🧪 Starting WebSocket integration tests...');

  const child = spawn(process.execPath, ['index.js'], {
    env: { ...process.env, PORT },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.stdout.on('data', d => process.stdout.write(`[server] ${d}`));
  child.stderr.on('data', d => process.stderr.write(`[server][err] ${d}`));

  try {
    // Wait for server to be ready
    const healthy = await probeHealth();
    if (!healthy) {
      throw new Error('Server health check failed');
    }

    console.log('✅ Server is healthy');

    // Test WebSocket connection
    await testWebSocketConnection();
    await wait(1000);

    // Test WebSocket pairing
    await testWebSocketPairing();

    console.log('✅ All WebSocket tests passed');
    child.kill('SIGTERM');
    process.exit(0);
  } catch (error) {
    console.error('❌ WebSocket test failed:', error.message);
    child.kill('SIGTERM');
    process.exit(1);
  }
})();

