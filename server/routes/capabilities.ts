import { Router, Request, Response } from 'express';
import { isImporterProviderConfigured } from '../services/importer.js';

export const capabilitiesRouter = Router();

export interface SystemCapabilities {
  importers: {
    linktree: boolean;
    beacons: boolean;
    biofm: boolean;
  };
  instagram: boolean;
  billing: boolean;
}

export function getSystemCapabilities(): SystemCapabilities {
  const instagramConfigured = Boolean(
    process.env.INSTAGRAM_CLIENT_ID &&
    process.env.INSTAGRAM_CLIENT_SECRET
  );

  const billingConfigured = Boolean(
    process.env.BILLING_ENABLED !== 'false' &&
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    process.env.APP_ORIGIN
  );

  return {
    importers: {
      linktree: isImporterProviderConfigured('linktree'),
      beacons: isImporterProviderConfigured('beacons'),
      biofm: isImporterProviderConfigured('biofm')
    },
    instagram: instagramConfigured,
    billing: billingConfigured
  };
}

capabilitiesRouter.get('/capabilities', (_req: Request, res: Response) => {
  res.json(getSystemCapabilities());
});
