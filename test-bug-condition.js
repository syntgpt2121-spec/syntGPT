// Bug Condition Exploration Test - Netlify Deploy Configuration Conflict
// This test MUST FAIL on unfixed code to confirm the bug exists

const fs = require('fs');
const path = require('path');

console.log('🔍 Bug Condition Exploration Test - Netlify Deploy Configuration');
console.log('=============================================================\n');

// Test 1: Check for conflicting netlify.toml files
console.log('Test 1: Conflicting netlify.toml files');
const rootNetlifyToml = fs.existsSync('netlify.toml');
const clientNetlifyToml = fs.existsSync('client/netlify.toml');

console.log(`  Root netlify.toml exists: ${rootNetlifyToml}`);
console.log(`  Client netlify.toml exists: ${clientNetlifyToml}`);

if (rootNetlifyToml && clientNetlifyToml) {
    console.log('  ❌ COUNTEREXAMPLE FOUND: Both netlify.toml files exist - this causes deployment conflicts');
    console.log('  Expected: Only one netlify.toml should exist');
} else {
    console.log('  ✅ No conflicting netlify.toml files detected');
}

// Test 2: Check for missing environment variables
console.log('\nTest 2: Missing environment variables');
const requiredEnvVars = ['GROQ_API_KEY', 'SMTP_USER', 'SMTP_PASS'];
const missingVars = [];

requiredEnvVars.forEach(varName => {
    const exists = process.env[varName] && process.env[varName].trim() !== '';
    console.log(`  ${varName}: ${exists ? 'SET' : 'MISSING'}`);
    if (!exists) {
        missingVars.push(varName);
    }
});

if (missingVars.length > 0) {
    console.log(`  ❌ COUNTEREXAMPLE FOUND: Missing environment variables: ${missingVars.join(', ')}`);
    console.log('  Expected: All required environment variables should be set');
} else {
    console.log('  ✅ All required environment variables are set');
}

// Test 3: Check netlify.toml configuration consistency
console.log('\nTest 3: Netlify configuration validation');
if (rootNetlifyToml) {
    const rootConfig = fs.readFileSync('netlify.toml', 'utf8');
    console.log('  Root netlify.toml configuration:');
    console.log('    Build command:', rootConfig.includes('npm --prefix client run build') ? 'CORRECT' : 'INCORRECT');
    console.log('    Publish dir:', rootConfig.includes('publish = "client/dist"') ? 'CORRECT' : 'INCORRECT');
    console.log('    Functions dir:', rootConfig.includes('functions = "netlify/functions"') ? 'CORRECT' : 'INCORRECT');
}

// Summary
console.log('\n📊 Bug Condition Test Summary:');
const bugExists = (rootNetlifyToml && clientNetlifyToml) || missingVars.length > 0;
console.log(`  Bug condition satisfied: ${bugExists ? 'YES' : 'NO'}`);

if (bugExists) {
    console.log('  🚨 EXPECTED OUTCOME: This test FAILS - confirming the bug exists');
    console.log('  Counterexamples documented above show the deployment issues');
    process.exit(1); // Fail the test to confirm bug exists
} else {
    console.log('  ✅ Bug condition not satisfied - deployment should work');
    process.exit(0);
}