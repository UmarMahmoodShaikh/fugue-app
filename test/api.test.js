// API Endpoint Tests
const { spawn } = require('child_process');

const PORT = process.env.PORT || '8080';
const BASE_URL = `http://127.0.0.1:${PORT}`;
const START_TIMEOUT = 10000;

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitForServer(timeoutMs = START_TIMEOUT) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.ok) return true;
    } catch (e) {
      // Server not ready
    }
    await wait(500);
  }
  return false;
}

async function testHealthEndpoint() {
  console.log('Testing /health endpoint...');
  const res = await fetch(`${BASE_URL}/health`);

  if (!res.ok) {
    throw new Error(`Health check failed with status ${res.status}`);
  }

  const data = await res.json();

  if (!data.status || data.status !== 'healthy') {
    throw new Error('Health status is not healthy');
  }

  if (!data.service || !data.timestamp) {
    throw new Error('Health response missing required fields');
  }

  console.log('✅ Health endpoint test passed');
  return true;
}

async function testWebSocketInfoEndpoint() {
  console.log('Testing /websocket-info endpoint...');
  const res = await fetch(`${BASE_URL}/websocket-info`);

  if (!res.ok) {
    throw new Error(`WebSocket info failed with status ${res.status}`);
  }

  const data = await res.json();

  if (!data.websocket_url || !data.supported_actions) {
    throw new Error('WebSocket info response missing required fields');
  }

  if (!Array.isArray(data.supported_actions)) {
    throw new Error('supported_actions should be an array');
  }

  console.log('✅ WebSocket info endpoint test passed');
  return true;
}

async function testRootEndpoint() {
  console.log('Testing / (root) endpoint...');
  const res = await fetch(`${BASE_URL}/`);

  if (!res.ok) {
    throw new Error(`Root endpoint failed with status ${res.status}`);
  }

  const html = await res.text();

  if (!html.includes('Fugue') && !html.includes('fugue')) {
    throw new Error('Root endpoint response does not contain expected content');
  }

  console.log('✅ Root endpoint test passed');
  return true;
}

async function testCORSHeaders() {
  console.log('Testing CORS headers...');
  const res = await fetch(`${BASE_URL}/health`);

  const corsHeader = res.headers.get('Access-Control-Allow-Origin');
  if (corsHeader !== '*') {
    console.log('⚠️  CORS header not set (may be intentional)');
  } else {
    console.log('✅ CORS headers configured');
  }

  return true;
}

async function runAllTests() {
  console.log('🧪 Starting API endpoint tests...');

  const child = spawn(process.execPath, ['index.js'], {
    env: { ...process.env, PORT },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.stdout.on('data', d => process.stdout.write(`[server] ${d}`));
  child.stderr.on('data', d => process.stderr.write(`[server][err] ${d}`));

  try {
    // Wait for server to be ready
    const ready = await waitForServer();
    if (!ready) {
      throw new Error('Server failed to start');
    }

    console.log('✅ Server started successfully\n');

    // Run all tests
    await testHealthEndpoint();
    await testWebSocketInfoEndpoint();
    await testRootEndpoint();
    await testCORSHeaders();

    console.log('\n✅ All API endpoint tests passed');
    child.kill('SIGTERM');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ API test failed:', error.message);
    child.kill('SIGTERM');
    process.exit(1);
  }
}

runAllTests();

