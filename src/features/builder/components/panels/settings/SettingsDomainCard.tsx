import React from 'react';
import { Globe2 } from 'lucide-react';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useBuilder } from '../../../context/BuilderContext';
import { brand } from '../../../../../config/brand';
import { planUnlocks } from '../../../config/studioNavigation';
import { UpgradeGate } from './UpgradeGate';

/** The custom-domain card: the creator's host, the exact CNAME target, and DNS verification. */
export const SettingsDomainCard: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const { profile, customDomainInput, setCustomDomainInput } = useBuilder();
  const canUseDomain = planUnlocks(profile.plan, 'custom-domain');

  return (
    <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-neutral-900">{ui("Custom Domain")}</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {ui("Link a verified domain or subdomain (e.g.")}<span className="font-mono" dir="ltr">links.yourbrand.com</span>{ui(") after your hosting provider provisions HTTPS.")}
            </p>
          </div>
        </div>
        {canUseDomain ? (
          <span className="whitespace-nowrap text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-md">
            {profile.customDomainVerified ? ui("DNS VERIFIED") : ui("SETUP REQUIRED")}
          </span>
        ) : (
          <UpgradeGate capability="custom-domain" />
        )}
      </div>

      <div className="space-y-3 pt-1">
        <div className="space-y-1.5">
          <label htmlFor="settings-custom-domain" className="text-xs font-semibold text-neutral-800">{ui("Domain / Subdomain Name")}</label>
          <input
            id="settings-custom-domain"
            name="customDomain"
            aria-label={ui("Domain / Subdomain Name")}
            dir="ltr"
            type="text"
            disabled={!canUseDomain}
            value={customDomainInput}
            onChange={e => setCustomDomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ''))}
            placeholder={ui("e.g. links.sarahcreator.com")}
            className="w-full text-xs font-mono p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-neutral-50 focus:border-neutral-900 outline-none transition-colors disabled:opacity-50"
          />
        </div>

        <DomainDnsInstructions />
        <DomainStatusNotices />
      </div>
    </div>
  );
};

const DomainDnsInstructions: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const { profile, handleCopyCname, copiedCname } = useBuilder();

  return (
    <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-2.5 text-xs">
      <span className="font-bold text-neutral-900 block text-xs">
        {ui("How to connect your domain:")}
      </span>
      <ol className="space-y-1.5 text-xs text-neutral-600 list-decimal list-inside leading-relaxed">
        <li>{ui("Enter your subdomain above (e.g. links.yourdomain.com)")}</li>
        <li>
          {ui("In your DNS provider (Cloudflare, GoDaddy, etc.), add a ")}
          <span className="font-mono font-bold text-neutral-900" dir="ltr">CNAME</span>
          {ui(" record pointing to:")}
        </li>
      </ol>
      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-neutral-200 font-mono text-xs shadow-2xs">
        <span className="font-bold text-neutral-800" dir="ltr">{brand.cnameTarget}</span>
        <button
          type="button"
          onClick={handleCopyCname}
          className="text-xs text-amber-700 hover:text-amber-800 font-sans font-bold cursor-pointer transition-colors"
        >
          {copiedCname ? ui("Copied!") : ui("Copy Target")}
        </button>
      </div>
      <p className="text-xs leading-relaxed text-neutral-500 pt-1">
        {profile.customDomainVerified
          ? ui("✓ Domain connected successfully. Secure HTTPS becomes active once your hosting provider completes TLS certificate provisioning.")
          : ui("3. Click 'Verify DNS' below once your record is created. Connect your custom domain with guided DNS verification.")}
      </p>
    </div>
  );
};

const DomainStatusNotices: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const {
    profile,
    customDomainInput,
    dnsVerificationResult,
    domainFeedback,
    isVerifyingDns,
    handleVerifyDns,
    isSavingDomain,
    handleSaveCustomDomain
  } = useBuilder();

  return (
    <>
      {dnsVerificationResult && (
        <div className={`p-3 rounded-xl text-xs border ${
          dnsVerificationResult.verified
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-amber-50 text-amber-800 border-amber-200'
        }`}>
          {dnsVerificationResult.message}
        </div>
      )}

      {domainFeedback && (
        <div
          role={domainFeedback.type === 'error' ? 'alert' : 'status'}
          className={`p-3 rounded-xl text-xs border font-medium ${
            domainFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {domainFeedback.message}
        </div>
      )}

      {profile.plan !== 'free' && (
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            disabled={isVerifyingDns || !customDomainInput.trim()}
            onClick={handleVerifyDns}
            className="px-3.5 py-2 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-xs font-semibold text-neutral-800 cursor-pointer disabled:opacity-50"
          >
            {isVerifyingDns ? ui("Checking DNS...") : ui("Verify DNS")}
          </button>

          <button
            type="button"
            disabled={isSavingDomain}
            onClick={handleSaveCustomDomain}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSavingDomain ? ui("Saving...") : ui("Save Domain")}
          </button>
        </div>
      )}
    </>
  );
};
