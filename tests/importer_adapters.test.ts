import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  ImporterService,
  LinktreeImporterAdapter,
  BeaconsImporterAdapter,
  BioFmImporterAdapter,
  DisabledImporterAdapter,
  isPrivateOrReservedIp,
  isSafePublicUrl,
  normalizeImportUrl,
  isSupportedImportUrl,
  importerService,
  commitImportedLinks
} from '../server/services/importer/index.js';
import { db } from '../server/db.js';
import { createId } from '../server/utils/ids.js';

describe('Importer Architecture & Adapter Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.LINKTREE_IMPORT_ENABLED;
    delete process.env.LINKTREE_API_KEY;
    delete process.env.BEACONS_IMPORT_ENABLED;
    delete process.env.BEACONS_API_KEY;
    delete process.env.BIOFM_IMPORT_ENABLED;
    delete process.env.BIOFM_API_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('1. Adapter Selection', () => {
    const service = new ImporterService();

    it('selects LinktreeImporterAdapter for Linktree domains', () => {
      const adapter1 = service.getAdapter('https://linktr.ee/username');
      expect(adapter1).toBeInstanceOf(LinktreeImporterAdapter);
      expect(adapter1.provider).toBe('linktree');

      const adapter2 = service.getAdapter('https://www.linktr.ee/username');
      expect(adapter2).toBeInstanceOf(LinktreeImporterAdapter);

      const adapter3 = service.getAdapter('https://sub.linktr.ee/username');
      expect(adapter3).toBeInstanceOf(LinktreeImporterAdapter);
    });

    it('selects BeaconsImporterAdapter for Beacons domains', () => {
      const adapter1 = service.getAdapter('https://beacons.ai/username');
      expect(adapter1).toBeInstanceOf(BeaconsImporterAdapter);
      expect(adapter1.provider).toBe('beacons');

      const adapter2 = service.getAdapter('https://www.beacons.ai/username');
      expect(adapter2).toBeInstanceOf(BeaconsImporterAdapter);
    });

    it('selects BioFmImporterAdapter for Bio.fm domains', () => {
      const adapter1 = service.getAdapter('https://bio.fm/username');
      expect(adapter1).toBeInstanceOf(BioFmImporterAdapter);
      expect(adapter1.provider).toBe('biofm');

      const adapter2 = service.getAdapter('https://www.bio.fm/username');
      expect(adapter2).toBeInstanceOf(BioFmImporterAdapter);
    });

    it('selects DisabledImporterAdapter for unsupported or unknown domains', () => {
      const adapter1 = service.getAdapter('https://example.com/username');
      expect(adapter1).toBeInstanceOf(DisabledImporterAdapter);
      expect(adapter1.provider).toBe('disabled');

      const adapter2 = service.getAdapter('https://instagram.com/username');
      expect(adapter2).toBeInstanceOf(DisabledImporterAdapter);

      const adapter3 = service.getAdapter('not-a-valid-url');
      expect(adapter3).toBeInstanceOf(DisabledImporterAdapter);
    });

    it('allows registering custom adapters with higher precedence', () => {
      const customService = new ImporterService();
      const mockCustomAdapter = {
        provider: 'generic' as const,
        name: 'Custom',
        isConfigured: () => true,
        matches: (url: string) => url.includes('custom-bio.com'),
        import: async (url: string) => ({
          sourceUrl: url,
          provider: 'generic' as const,
          links: [{ title: 'Custom Link', url: 'https://example.com' }],
          socials: [],
          warnings: []
        })
      };

      customService.registerAdapter(mockCustomAdapter);
      const matched = customService.getAdapter('https://custom-bio.com/user');
      expect(matched.name).toBe('Custom');
      expect(matched.isConfigured()).toBe(true);
    });
  });

  describe('2. Disabled Provider Behavior', () => {
    it('reports unconfigured when environment variables are unset', () => {
      const linktree = new LinktreeImporterAdapter();
      const beacons = new BeaconsImporterAdapter();
      const biofm = new BioFmImporterAdapter();
      const disabled = new DisabledImporterAdapter();

      expect(linktree.isConfigured()).toBe(false);
      expect(beacons.isConfigured()).toBe(false);
      expect(biofm.isConfigured()).toBe(false);
      expect(disabled.isConfigured()).toBe(false);
    });

    it('fails closed when attempting import on unconfigured provider adapters', async () => {
      const linktree = new LinktreeImporterAdapter();
      await expect(linktree.import('https://linktr.ee/test')).rejects.toThrow(
        /authorized provider API or export/i
      );

      const beacons = new BeaconsImporterAdapter();
      await expect(beacons.import('https://beacons.ai/test')).rejects.toThrow(
        /authorized provider API or export/i
      );

      const biofm = new BioFmImporterAdapter();
      await expect(biofm.import('https://bio.fm/test')).rejects.toThrow(
        /authorized provider API or export/i
      );
    });

    it('DisabledImporterAdapter explicitly throws unsupported error on import', async () => {
      const disabled = new DisabledImporterAdapter();
      await expect(disabled.import('https://random.com/test')).rejects.toThrow(
        /Only public Linktree, Beacons, or Bio.fm profile URLs are supported/i
      );
    });
  });

  describe('3. Unsupported Host Behavior', () => {
    it('rejects unsupported domains before reaching provider fetching', async () => {
      await expect(importerService.importFromPublicUrl('https://example.com/profile')).rejects.toThrow(
        /Only public Linktree, Beacons, or Bio.fm profile URLs are supported/i
      );
      await expect(importerService.importFromPublicUrl('https://tiktok.com/@user')).rejects.toThrow(
        /Only public Linktree, Beacons, or Bio.fm profile URLs are supported/i
      );
    });

    it('rejects empty, invalid, or non-URL strings', async () => {
      await expect(importerService.importFromPublicUrl('')).rejects.toThrow(
        /Only public Linktree, Beacons, or Bio.fm profile URLs are supported/i
      );
      await expect(importerService.importFromPublicUrl('   ')).rejects.toThrow(
        /Only public Linktree, Beacons, or Bio.fm profile URLs are supported/i
      );
    });

    it('isSupportedImportUrl validates only approved source hosts over HTTPS', () => {
      expect(isSupportedImportUrl('https://linktr.ee/valid')).toBe(true);
      expect(isSupportedImportUrl('https://beacons.ai/valid')).toBe(true);
      expect(isSupportedImportUrl('https://bio.fm/valid')).toBe(true);
      expect(isSupportedImportUrl('http://linktr.ee/valid')).toBe(false); // HTTP rejected
      expect(isSupportedImportUrl('https://evil-linktr.ee/valid')).toBe(false);
      expect(isSupportedImportUrl('https://linktree.com/valid')).toBe(false);
    });
  });

  describe('4. Security Utility Behavior (SSRF & IP Validation)', () => {
    it('correctly classifies private and reserved IPv4 addresses', () => {
      expect(isPrivateOrReservedIp('127.0.0.1')).toBe(true); // Loopback
      expect(isPrivateOrReservedIp('10.0.0.1')).toBe(true); // RFC1918 Class A
      expect(isPrivateOrReservedIp('172.16.0.1')).toBe(true); // RFC1918 Class B
      expect(isPrivateOrReservedIp('172.31.255.255')).toBe(true); // RFC1918 Class B
      expect(isPrivateOrReservedIp('192.168.1.1')).toBe(true); // RFC1918 Class C
      expect(isPrivateOrReservedIp('169.254.169.254')).toBe(true); // Link-local / Cloud metadata
      expect(isPrivateOrReservedIp('100.64.0.1')).toBe(true); // Carrier-grade NAT
      expect(isPrivateOrReservedIp('0.0.0.0')).toBe(true); // Current network
      expect(isPrivateOrReservedIp('224.0.0.1')).toBe(true); // Multicast
      expect(isPrivateOrReservedIp('240.0.0.1')).toBe(true); // Reserved
      expect(isPrivateOrReservedIp('8.8.8.8')).toBe(false); // Public DNS
      expect(isPrivateOrReservedIp('1.1.1.1')).toBe(false); // Public DNS
      expect(isPrivateOrReservedIp('not-an-ip')).toBe(true); // Malformed treated as unsafe
    });

    it('correctly classifies private and reserved IPv6 addresses', () => {
      expect(isPrivateOrReservedIp('::1')).toBe(true); // Loopback
      expect(isPrivateOrReservedIp('::')).toBe(true); // Unspecified
      expect(isPrivateOrReservedIp('fc00::1')).toBe(true); // Unique local
      expect(isPrivateOrReservedIp('fd12:3456:789a::1')).toBe(true); // Unique local
      expect(isPrivateOrReservedIp('fe80::1')).toBe(true); // Link-local
      expect(isPrivateOrReservedIp('::ffff:127.0.0.1')).toBe(true); // IPv4-mapped loopback
      expect(isPrivateOrReservedIp('::ffff:192.168.1.1')).toBe(true); // IPv4-mapped private
      expect(isPrivateOrReservedIp('::ffff:8.8.8.8')).toBe(false); // IPv4-mapped public
      expect(isPrivateOrReservedIp('2606:4700:4700::1111')).toBe(false); // Cloudflare public IPv6
    });

    it('isSafePublicUrl blocks unsafe protocols, hostnames, and representations', () => {
      expect(isSafePublicUrl('ftp://linktr.ee/user')).toBe(false);
      expect(isSafePublicUrl('file:///etc/passwd')).toBe(false);
      expect(isSafePublicUrl('javascript:alert(1)')).toBe(false);
      expect(isSafePublicUrl('http://localhost/user')).toBe(false);
      expect(isSafePublicUrl('http://service.internal/user')).toBe(false);
      expect(isSafePublicUrl('http://device.local/user')).toBe(false);
      expect(isSafePublicUrl('http://metadata.google.internal/computeMetadata')).toBe(false);
      expect(isSafePublicUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
      expect(isSafePublicUrl('http://2130706433/')).toBe(false); // Decimal IP representation
      expect(isSafePublicUrl('http://0x7f000001/')).toBe(false); // Hex IP representation
      expect(isSafePublicUrl('https://linktr.ee/alice')).toBe(true);
      expect(isSafePublicUrl('https://beacons.ai/bob')).toBe(true);
    });

    it('normalizeImportUrl normalizes short handles and variants safely', () => {
      expect(normalizeImportUrl('@alice')).toBe('https://linktr.ee/alice');
      expect(normalizeImportUrl('alice')).toBe('https://linktr.ee/alice');
      expect(normalizeImportUrl('linktr.ee/bob')).toBe('https://linktr.ee/bob');
      expect(normalizeImportUrl('www.beacons.ai/charlie')).toBe('https://www.beacons.ai/charlie');
      expect(normalizeImportUrl('https://bio.fm/dana')).toBe('https://bio.fm/dana');
      expect(normalizeImportUrl('')).toBeNull();
    });
  });

  describe('5. Capability Reporting', () => {
    it('reports all providers disabled by default', () => {
      const caps = importerService.getCapabilities();
      expect(caps).toEqual({
        linktree: false,
        beacons: false,
        biofm: false
      });
    });

    it('dynamically reflects configuration state when env vars are present', () => {
      process.env.LINKTREE_IMPORT_ENABLED = 'true';
      process.env.LINKTREE_API_KEY = 'mock-key';

      const caps = importerService.getCapabilities();
      expect(caps.linktree).toBe(true);
      expect(caps.beacons).toBe(false);
      expect(caps.biofm).toBe(false);

      process.env.BEACONS_IMPORT_ENABLED = 'true';
      process.env.BEACONS_API_KEY = 'mock-beacons-key';
      expect(importerService.getCapabilities().beacons).toBe(true);
    });

    it('requires both enabled flag and API key for configured status', () => {
      process.env.BIOFM_IMPORT_ENABLED = 'true';
      delete process.env.BIOFM_API_KEY;
      expect(importerService.isProviderConfigured('biofm')).toBe(false);

      process.env.BIOFM_API_KEY = 'key-only';
      process.env.BIOFM_IMPORT_ENABLED = 'false';
      expect(importerService.isProviderConfigured('biofm')).toBe(false);

      process.env.BIOFM_IMPORT_ENABLED = 'true';
      expect(importerService.isProviderConfigured('biofm')).toBe(true);
    });
  });

  describe('6. Commit Imported Links Logic', () => {
    it('commits links atomically, skips duplicates, and updates profile metadata', () => {
      const profileId = createId('prof');
      const now = Date.now();
      db.prepare(`
        INSERT INTO profiles (id, user_id, username, display_name, bio, theme_id, created_at, updated_at)
        VALUES (?, NULL, ?, ?, ?, 'dark', ?, ?)
      `).run(profileId, `test-${Date.now()}`, 'Original Name', 'Original Bio', now, now);

      const commitResult1 = commitImportedLinks(profileId, {
        links: [
          { title: 'Portfolio', url: 'https://example.com/portfolio', subtitle: 'My work' },
          { title: 'Twitter', url: 'https://twitter.com/test' }
        ],
        updateProfileInfo: true,
        displayName: 'Imported Name',
        bio: 'Imported Bio'
      });

      expect(commitResult1.imported).toBe(2);
      expect(commitResult1.skippedDuplicates).toBe(0);

      // Verify profile update
      const updatedProf = db.prepare('SELECT display_name, bio FROM profiles WHERE id = ?').get(profileId) as any;
      expect(updatedProf.display_name).toBe('Imported Name');
      expect(updatedProf.bio).toBe('Imported Bio');

      // Verify committing duplicate links skips them
      const commitResult2 = commitImportedLinks(profileId, {
        links: [
          { title: 'Portfolio Duplicate', url: 'https://example.com/portfolio' },
          { title: 'New Link', url: 'https://example.com/new' }
        ]
      });

      expect(commitResult2.imported).toBe(1);
      expect(commitResult2.skippedDuplicates).toBe(1);
    });

    it('throws when creator profile is not found', () => {
      expect(() => {
        commitImportedLinks('non-existent-profile', {
          links: [{ title: 'Link', url: 'https://example.com' }]
        });
      }).toThrow('Creator profile not found.');
    });

    it('throws when destination page is specified but does not exist', () => {
      const profileId = createId('prof');
      const now = Date.now();
      db.prepare(`
        INSERT INTO profiles (id, user_id, username, display_name, bio, theme_id, created_at, updated_at)
        VALUES (?, NULL, ?, ?, ?, 'dark', ?, ?)
      `).run(profileId, `test-${Date.now()}`, 'Name', 'Bio', now, now);

      expect(() => {
        commitImportedLinks(profileId, {
          pageId: 'non-existent-page',
          links: [{ title: 'Link', url: 'https://example.com' }]
        });
      }).toThrow('The selected destination page is unavailable.');
    });
  });
});

