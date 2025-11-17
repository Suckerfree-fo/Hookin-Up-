#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Hookin-Up development environment...\n');

// Check Node version
const nodeVersion = process.version;
console.log(`✓ Node.js version: ${nodeVersion}`);

if (parseInt(nodeVersion.slice(1)) < 20) {
  console.error('❌ Node.js 20 or higher is required');
  process.exit(1);
}

// Check if Docker is running
try {
  execSync('docker --version', { stdio: 'ignore' });
  console.log('✓ Docker is installed');
} catch (error) {
  console.warn('⚠️  Docker not found. You\'ll need to run PostgreSQL and Redis manually.');
}

// Create .env files if they don't exist
if (!fs.existsSync('backend/.env')) {
  fs.copyFileSync('backend/.env.example', 'backend/.env');
  console.log('✓ Created backend/.env');
}

if (!fs.existsSync('frontend/.env')) {
  fs.copyFileSync('frontend/.env.example', 'frontend/.env');
  console.log('✓ Created frontend/.env');
}

console.log('\n✅ Setup complete!\n');
console.log('Next steps:');
console.log('1. Update backend/.env and frontend/.env with your credentials');
console.log('2. Start Docker services: npm run docker:up');
console.log('3. Run database migrations: cd backend && npx prisma migrate dev');
console.log('4. Start development: npm run dev');
console.log('\n📚 Check README.md for more details\n');
