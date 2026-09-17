import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Architecture & Dependency Boundaries', () => {
  const rootDir = path.resolve(__dirname, '..');
  const serverDir = path.resolve(rootDir, 'server');
  const sharedDir = path.resolve(rootDir, 'shared');

  function collectFiles(dir: string, extension: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...collectFiles(fullPath, extension));
      } else if (entry.isFile() && entry.name.endsWith(extension)) {
        files.push(fullPath);
      }
    }
    return files;
  }

  it('ensures backend (server/) contains ZERO imports from frontend (src/)', () => {
    const serverFiles = collectFiles(serverDir, '.ts');
    expect(serverFiles.length).toBeGreaterThan(0);

    const violations: { file: string; line: number; content: string }[] = [];

    // Check for any import/require referencing src/
    const forbiddenSrcImport = /(?:from\s+['"][^'"]*\/src\/|from\s+['"]\.\.\/src|import\s*\(['"][^'"]*\/src\/)/;

    for (const file of serverFiles) {
      const lines = fs.readFileSync(file, 'utf-8').split('\n');
      lines.forEach((line, index) => {
        if (forbiddenSrcImport.test(line)) {
          violations.push({
            file: path.relative(rootDir, file),
            line: index + 1,
            content: line.trim()
          });
        }
      });
    }

    expect(violations, `Found forbidden imports from src/ in server files:\n${JSON.stringify(violations, null, 2)}`).toEqual([]);
  });

  it('ensures shared/ contains ZERO React or DOM-specific dependencies', () => {
    const sharedFiles = collectFiles(sharedDir, '.ts');
    expect(sharedFiles.length).toBeGreaterThan(0);

    const forbiddenFrameworkModules = [
      'react',
      'react-dom',
      '@sentry/react',
      '@gsap/react',
      'lucide-react',
      'wouter',
      'canvas-confetti'
    ];

    const violations: { file: string; line: number; content: string }[] = [];

    for (const file of sharedFiles) {
      const lines = fs.readFileSync(file, 'utf-8').split('\n');
      lines.forEach((line, index) => {
        for (const mod of forbiddenFrameworkModules) {
          const importRegex = new RegExp(`from\\s+['"]${mod}(?:/|['"])`);
          if (importRegex.test(line)) {
            violations.push({
              file: path.relative(rootDir, file),
              line: index + 1,
              content: line.trim()
            });
          }
        }
      });
    }

    expect(violations, `Found forbidden frontend framework imports in shared files:\n${JSON.stringify(violations, null, 2)}`).toEqual([]);
  });

  it('ensures shared/ contains ZERO server-only secrets or native bindings', () => {
    const sharedFiles = collectFiles(sharedDir, '.ts');
    expect(sharedFiles.length).toBeGreaterThan(0);

    const serverOnlyModules = [
      'better-sqlite3',
      'dotenv',
      'stripe',
      'jsonwebtoken',
      'bcryptjs',
      'express',
      'multer',
      '@sentry/node'
    ];

    const violations: { file: string; line: number; content: string }[] = [];

    for (const file of sharedFiles) {
      const lines = fs.readFileSync(file, 'utf-8').split('\n');
      lines.forEach((line, index) => {
        for (const mod of serverOnlyModules) {
          const importRegex = new RegExp(`from\\s+['"]${mod}(?:/|['"])`);
          if (importRegex.test(line)) {
            violations.push({
              file: path.relative(rootDir, file),
              line: index + 1,
              content: line.trim()
            });
          }
        }
      });
    }

    expect(violations, `Found forbidden server-only imports in shared files:\n${JSON.stringify(violations, null, 2)}`).toEqual([]);
  });

  it('evaluates shared/ modules cleanly in runtime', async () => {
    const shared = await import('../shared/index.js');
    expect(shared.CONTRACT_VERSION).toBe(1);
    expect(shared.RESERVED_USERNAMES.length).toBeGreaterThan(0);
    expect(shared.brand.domain).toBe('liinx.app');
    expect(shared.pageTitles['/']).toBeDefined();
    expect(shared.paidPlans.pro.name).toBe('Liinx Pro');
    expect(typeof shared.isHttpUrl).toBe('function');
    expect(typeof shared.bookingUrl).toBe('function');
    expect(typeof shared.getPhoneHref).toBe('function');
    expect(typeof shared.getMailtoHref).toBe('function');
    expect(typeof shared.parseBlockContract).toBe('function');
    expect(shared.contactSchema).toBeDefined();
    expect(shared.registerSchema).toBeDefined();
    expect(shared.loginSchema).toBeDefined();
    expect(shared.importerPreviewSchema).toBeDefined();
    expect(shared.importerCommitSchema).toBeDefined();
    expect(shared.formSubmissionSchema).toBeDefined();
    expect(shared.DEFAULT_CAPABILITIES).toBeDefined();
  });
});
