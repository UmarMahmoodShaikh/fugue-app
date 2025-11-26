// Basic frontend tests
const fs = require('fs');
const path = require('path');

console.log('🧪 Running frontend tests...');

// Test 1: Check if main files exist
const requiredFiles = [
  'src/App.jsx',
  'src/main.jsx',
  'index.html',
  'package.json',
  'vite.config.js'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, '..', file))) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} is missing`);
    process.exit(1);
  }
});

// Test 2: Check if package.json is valid
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  if (packageJson.name && packageJson.scripts) {
    console.log('✅ package.json is valid and has required fields');
  } else {
    throw new Error('Missing required fields');
  }
} catch (error) {
  console.log('❌ package.json test failed:', error.message);
  process.exit(1);
}

// Test 3: Check if dependencies are reasonable
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const hasDeps = packageJson.dependencies && Object.keys(packageJson.dependencies).length > 0;
  const hasDevDeps = packageJson.devDependencies && Object.keys(packageJson.devDependencies).length > 0;
  
  if (hasDeps && hasDevDeps) {
    console.log('✅ Dependencies are properly configured');
  } else {
    console.log('⚠️ Warning: Dependencies might be missing');
  }
} catch (error) {
  console.log('❌ Dependency test failed:', error.message);
  process.exit(1);
}

// Test 4: Check if main React components exist
try {
  const appJsxContent = fs.readFileSync(path.join(__dirname, '..', 'src/App.jsx'), 'utf8');
  if (appJsxContent.includes('export default') && appJsxContent.includes('function')) {
    console.log('✅ App.jsx has valid React component structure');
  } else {
    throw new Error('App.jsx does not appear to be a valid React component');
  }
} catch (error) {
  console.log('❌ React component test failed:', error.message);
  process.exit(1);
}

console.log('✅ All basic frontend tests passed!');
process.exit(0);