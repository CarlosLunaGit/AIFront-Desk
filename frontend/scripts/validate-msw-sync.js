#!/usr/bin/env node

/**
 * MSW-Backend API Synchronization Validator
 * 
 * This script validates that MSW handlers are synchronized with backend routes
 * by parsing both backend route files and MSW handlers to identify mismatches.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_ROUTES_DIR = '../../backend/src/routes';
const MSW_HANDLERS_FILE = '../src/mocks/handlers.ts';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

/**
 * Extract HTTP endpoints from backend route files
 */
function extractBackendEndpoints() {
  const endpoints = [];
  const routesDir = path.resolve(__dirname, BACKEND_ROUTES_DIR);
  
  if (!fs.existsSync(routesDir)) {
    console.error(`${colors.red}Backend routes directory not found: ${routesDir}${colors.reset}`);
    return endpoints;
  }

  const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.ts'));
  
  routeFiles.forEach(file => {
    const filePath = path.join(routesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Regex patterns to match Express route definitions
    const routePatterns = [
      /router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /app\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g
    ];
    
    routePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        const route = match[2];
        
        endpoints.push({
          method,
          route,
          file: file.replace('.ts', ''),
          fullPath: `/api/${file.replace('.ts', '')}${route}`.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
        });
      }
    });
  });
  
  return endpoints;
}

/**
 * Extract HTTP endpoints from MSW handlers
 */
function extractMSWEndpoints() {
  const endpoints = [];
  const handlersPath = path.resolve(__dirname, MSW_HANDLERS_FILE);
  
  if (!fs.existsSync(handlersPath)) {
    console.error(`${colors.red}MSW handlers file not found: ${handlersPath}${colors.reset}`);
    return endpoints;
  }

  const content = fs.readFileSync(handlersPath, 'utf8');
  
  // Regex pattern to match MSW http handlers
  const mswPattern = /http\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  
  let match;
  while ((match = mswPattern.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const route = match[2];
    
    endpoints.push({
      method,
      route,
      file: 'handlers.ts'
    });
  }
  
  return endpoints;
}

/**
 * Normalize route for comparison (handle parameters)
 */
function normalizeRoute(route) {
  return route
    .replace(/\/:\w+/g, '/:param') // Convert :id to :param
    .replace(/\/+/g, '/') // Remove duplicate slashes
    .replace(/\/$/, '') || '/'; // Remove trailing slash
}

/**
 * Compare backend and MSW endpoints
 */
function compareEndpoints() {
  console.log(`${colors.bold}🔄 MSW-Backend API Synchronization Validator${colors.reset}\n`);
  
  const backendEndpoints = extractBackendEndpoints();
  const mswEndpoints = extractMSWEndpoints();
  
  console.log(`${colors.blue}📊 Analysis Results:${colors.reset}`);
  console.log(`  Backend endpoints: ${backendEndpoints.length}`);
  console.log(`  MSW endpoints: ${mswEndpoints.length}\n`);
  
  // Create lookup maps
  const backendMap = new Map();
  const mswMap = new Map(); 
  
  backendEndpoints.forEach(ep => {
    const key = `${ep.method} ${normalizeRoute(ep.fullPath)}`;
    backendMap.set(key, ep);
  });
  
  mswEndpoints.forEach(ep => {
    const key = `${ep.method} ${normalizeRoute(ep.route)}`;
    mswMap.set(key, ep);
  });
  
  // Find synchronized endpoints
  const synchronized = [];
  const backendMissing = [];
  const mswObsolete = [];
  
  for (const [key, backendEp] of backendMap) {
    if (mswMap.has(key)) {
      synchronized.push({ key, backend: backendEp, msw: mswMap.get(key) });
    } else {
      backendMissing.push({ key, backend: backendEp });
    }
  }
  
  for (const [key, mswEp] of mswMap) {
    if (!backendMap.has(key)) {
      mswObsolete.push({ key, msw: mswEp });
    }
  }
  
  // Report synchronized endpoints
  if (synchronized.length > 0) {
    console.log(`${colors.green}✅ Synchronized Endpoints (${synchronized.length}):${colors.reset}`);
    synchronized.forEach(({ key }) => {
      console.log(`  ${colors.green}✓${colors.reset} ${key}`);
    });
    console.log();
  }
  
  // Report missing MSW handlers
  if (backendMissing.length > 0) {
    console.log(`${colors.yellow}⚠️  Backend endpoints missing MSW handlers (${backendMissing.length}):${colors.reset}`);
    backendMissing.forEach(({ key, backend }) => {
      console.log(`  ${colors.yellow}!${colors.reset} ${key} (${backend.file}.ts)`);
    });
    console.log();
  }
  
  // Report potentially obsolete MSW handlers
  if (mswObsolete.length > 0) {
    console.log(`${colors.red}🗑️  MSW handlers potentially obsolete (${mswObsolete.length}):${colors.reset}`);
    mswObsolete.forEach(({ key }) => {
      console.log(`  ${colors.red}×${colors.reset} ${key}`);
    });
    console.log();
  }
  
  // Summary
  const syncPercentage = backendEndpoints.length > 0 
    ? Math.round((synchronized.length / backendEndpoints.length) * 100) 
    : 0;
  
  console.log(`${colors.bold}📈 Sync Summary:${colors.reset}`);
  console.log(`  Sync rate: ${syncPercentage}% (${synchronized.length}/${backendEndpoints.length})`);
  console.log(`  Missing handlers: ${backendMissing.length}`);
  console.log(`  Potentially obsolete: ${mswObsolete.length}`);
  
  // Exit with error if there are sync issues
  if (backendMissing.length > 0 || mswObsolete.length > 0) {
    console.log(`\n${colors.red}❌ Synchronization issues detected!${colors.reset}`);
    console.log(`${colors.yellow}💡 Next steps:${colors.reset}`);
    console.log(`  1. Add missing MSW handlers for backend endpoints`);
    console.log(`  2. Review potentially obsolete MSW handlers`);
    console.log(`  3. Update MSW_BACKEND_SYNC_GUIDE.md with changes`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}✅ All endpoints are synchronized!${colors.reset}`);
    process.exit(0);
  }
}

/**
 * Show detailed backend endpoints for debugging
 */
function showBackendEndpoints() {
  const endpoints = extractBackendEndpoints();
  console.log(`${colors.bold}Backend Endpoints (${endpoints.length}):${colors.reset}`);
  endpoints.forEach(ep => {
    console.log(`  ${ep.method} ${ep.fullPath} (${ep.file}.ts)`);
  });
}

/**
 * Show detailed MSW endpoints for debugging  
 */
function showMSWEndpoints() {
  const endpoints = extractMSWEndpoints();
  console.log(`${colors.bold}MSW Endpoints (${endpoints.length}):${colors.reset}`);
  endpoints.forEach(ep => {
    console.log(`  ${ep.method} ${ep.route}`);
  });
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case '--backend':
    showBackendEndpoints();
    break;
  case '--msw':
    showMSWEndpoints();
    break;
  case '--help':
    console.log(`${colors.bold}MSW-Backend Sync Validator${colors.reset}
    
Usage:
  node validate-msw-sync.js          Run sync validation
  node validate-msw-sync.js --backend Show backend endpoints
  node validate-msw-sync.js --msw     Show MSW endpoints
  node validate-msw-sync.js --help    Show this help
`);
    break;
  default:
    compareEndpoints();
} 