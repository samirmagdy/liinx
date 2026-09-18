import assert from 'node:assert';
import { SYSTEM_DEMO_PROFILES, findSystemDemoProfile } from '../shared/constants/systemDemos.js';

console.log('Verifying system demo profiles and routes integrity...');

// 1. Verify all demo profiles have required fields
for (const demo of SYSTEM_DEMO_PROFILES) {
  assert(demo.id, `Demo profile must have an ID: ${JSON.stringify(demo)}`);
  assert(demo.username, `Demo profile must have a username: ${demo.id}`);
  assert(demo.displayName, `Demo profile must have a displayName: ${demo.id}`);
  assert(Array.isArray(demo.blocks) && demo.blocks.length > 0, `Demo profile must contain blocks: ${demo.id}`);
  console.log(`  ✓ Demo profile valid: @${demo.username} (${demo.displayName}) [${demo.id}]`);
}

// 2. Verify canonical /demo/:alias resolution
const testAliases = [
  ['photographer', 'elenarostova'],
  ['musician', 'marcusvance'],
  ['music', 'marcusvance'],
  ['business', 'sarahchen'],
  ['brand', 'sarahchen'],
  ['elenarostova', 'elenarostova'],
  ['marcusvance', 'marcusvance'],
  ['sarahchen', 'sarahchen']
];

for (const [alias, expectedUsername] of testAliases) {
  const resolved = findSystemDemoProfile(alias);
  assert(resolved, `Failed to resolve demo alias: ${alias}`);
  assert.strictEqual(
    resolved.username.toLowerCase(),
    expectedUsername.toLowerCase(),
    `Alias ${alias} resolved to ${resolved.username} instead of ${expectedUsername}`
  );
  console.log(`  ✓ Route alias resolution: /demo/${alias} -> @${resolved.username}`);
}

console.log(JSON.stringify({
  status: 'PASS',
  demosVerified: SYSTEM_DEMO_PROFILES.length,
  aliasesVerified: testAliases.length
}, null, 2));
