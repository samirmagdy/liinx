import { Router } from 'express';
import { db } from '../db.js';
import { brand } from '../../shared/index.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { sharedRateLimit } from '../middleware/rateLimit.js';
import { inspectCname, type DnsFinding } from '../services/dnsRecords.js';
import { hasEntitlement } from '../entitlements.js';
import { getEffectivePlan } from '../accountEntitlements.js';
import { normalizeCustomDomain } from '../utils/customDomain.js';

export const domainsRouter = Router();

/**
 * The API answer for scripts and the v1 surface. The Studio composes its own sentence from
 * `state` so the wording can be localized; this text stays English on purpose.
 */
function dnsFindingMessage(host: string, target: string, finding: DnsFinding): string {
  if (finding.state === 'verified') return `DNS is set up: ${host} points to ${target}.`;
  if (finding.state === 'no-record') return `No CNAME record was found for ${host}. Add a CNAME record for ${host} pointing to ${target}.`;
  if (finding.state === 'pointing-elsewhere') {
    return `${host} points to ${finding.foundTargets.join(', ')} instead of ${target}. Update the CNAME record to ${target}.`;
  }
  return `We could not read DNS for ${host} just now. Try again in a minute.`;
}

// Authenticated: Verify DNS CNAME for a custom domain
domainsRouter.post(
  '/studio/custom-domain/verify',
  requireAuth,
  // The guided flow polls this while it waits for DNS to propagate.
  sharedRateLimit({ name: 'domain-verify', limit: 60, windowMs: 5 * 60 * 1000 }),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { domain } = req.body;
      if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ error: 'Domain name is required.' });
      }

      const cleanDomain = normalizeCustomDomain(domain);
      if (!cleanDomain) return res.status(400).json({ error: 'Invalid domain format. Use a hostname such as links.yourdomain.com.' });

      const saved = db.prepare('SELECT custom_domain FROM profiles WHERE id = ?').get(req.user!.profileId) as { custom_domain?: string | null } | undefined;
      if (!saved?.custom_domain || saved.custom_domain !== cleanDomain) {
        return res.status(409).json({ error: 'Verify the exact custom domain saved on this profile.' });
      }
      if (!hasEntitlement(getEffectivePlan(req.user!.profileId), 'customDomain')) {
        return res.status(403).json({ error: 'Custom domains require a Pro or Studio subscription plan.' });
      }

      const expectedTarget = brand.cnameTarget;
      const finding = await inspectCname(cleanDomain, expectedTarget);
      const isVerified = finding.state === 'verified';

      // A failed DNS check must revoke the old flag; otherwise a changed DNS record would
      // remain publicly routable based on stale database state.
      db.prepare('UPDATE profiles SET custom_domain_verified = ?, updated_at = ? WHERE id = ? AND custom_domain = ?').run(
        isVerified ? 1 : 0, Date.now(), req.user!.profileId, cleanDomain
      );

      res.json({
        domain: cleanDomain,
        verified: isVerified,
        dnsVerified: isVerified,
        state: finding.state,
        tlsStatus: 'external_provider_required',
        tlsProvider: 'fly.io',
        expectedTarget,
        foundTargets: finding.foundTargets,
        cnameRecords: finding.foundTargets,
        message: dnsFindingMessage(cleanDomain, expectedTarget, finding)
      });
    } catch (err: any) {
      console.error('Custom domain verify error:', err);
      res.status(500).json({ error: 'Failed to verify DNS record.' });
    }
  }
);
