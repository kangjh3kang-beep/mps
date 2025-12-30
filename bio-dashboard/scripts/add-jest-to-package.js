#!/usr/bin/env node
/**
 * Add Jest configuration to package.json
 * Run: node scripts/add-jest-to-package.js
 */

const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, '..', 'package.json');

try {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  
  // Add test scripts
  pkg.scripts = pkg.scripts || {};
  pkg.scripts.test = 'jest';
  pkg.scripts['test:watch'] = 'jest --watch';
  pkg.scripts['test:coverage'] = 'jest --coverage';
  pkg.scripts['test:ci'] = 'jest --ci --coverage --maxWorkers=2';
  
  // Write back
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
  console.log('✅ Added test scripts to package.json');
  
  console.log(`
📦 Now install Jest and React Testing Library:

npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom @types/jest

Then run tests with:
npm run test
`);
} catch (e) {
  console.error('❌ Failed to update package.json:', e.message);
  process.exit(1);
}


