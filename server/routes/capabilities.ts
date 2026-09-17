import { Router, type Request, type Response } from 'express';
import { importerService } from '../services/importer.js';
import { supportsHorizontalScaling } from '../infrastructure/safeguards.js';
import { type SystemCapabilities } from '../../shared/index.js';

export const capabilitiesRouter = Router();

export type { SystemCapabilities };

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
    importers: importerService.getCapabilities(),
    instagram: instagramConfigured,
    billing: billingConfigured,
    supportsHorizontalScaling
  };
}

capabilitiesRouter.get('/capabilities', (_req: Request, res: Response) => {
  res.json(getSystemCapabilities());
});
