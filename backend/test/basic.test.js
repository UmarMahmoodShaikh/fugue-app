// Basic backend tests
const assert = require('assert');
const http = require('http');

console.log('🧪 Running backend tests...');

// Test 1: Check if main files exist
try {
  require('../index.js');
  console.log('✅ index.js loads without errors');
} catch (error) {
  console.log('❌ index.js failed to load:', error.message);
  process.exit(1);
}

try {
  require('../db.js');
  console.log('✅ db.js loads without errors');
} catch (error) {
  console.log('❌ db.js failed to load:', error.message);
  process.exit(1);
}

// Test 2: Basic assertions
try {
  const dbModule = require('../db.js');
  assert(typeof dbModule.pool === 'object', 'pool should be an object');
  assert(typeof dbModule.ensureSchema === 'function', 'ensureSchema should be a function');
  assert(typeof dbModule.createUser === 'function', 'createUser should be a function');
  console.log('✅ Database functions are properly exported');
} catch (error) {
  console.log('❌ Database function test failed:', error.message);
  process.exit(1);
}

// Test 3: Environment variables
try {
  require('dotenv').config();
  console.log('✅ Environment configuration loaded');
} catch (error) {
  console.log('⚠️ Warning: Could not load environment config:', error.message);
}

console.log('✅ All basic backend tests passed!');
process.exit(0);