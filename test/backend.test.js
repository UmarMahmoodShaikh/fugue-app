// Simple backend integration test: start the server and poll /health
const { spawn } = require('child_process');

const PORT = process.env.PORT || '8080';
const START_TIMEOUT = 10000; // ms

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function probeHealth(timeoutMs = START_TIMEOUT) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/health`);
      if (res.ok) {
        const body = await res.json();
        console.log('Health response:', body);
        return true;
      }
    } catch (e) {
      // ignore - server not ready
    }
    await wait(500);
  }
  return false;
}

(async () => {
  console.log('Starting backend for test on port', PORT);
  const child = spawn(process.execPath, ['index.js'], {
    env: { ...process.env, PORT },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.stdout.on('data', d => process.stdout.write(`[server] ${d}`));
  child.stderr.on('data', d => process.stderr.write(`[server][err] ${d}`));

  const ok = await probeHealth();

  // Ensure we kill the server
  try { child.kill('SIGTERM'); } catch (e) { /* ignore */ }

  if (!ok) {
    console.error('❌ Backend failed health check');
    process.exit(1);
  }

  console.log('✅ Backend health check passed');
  process.exit(0);
})();

