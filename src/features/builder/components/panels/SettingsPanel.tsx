import React from 'react';
import {
  ShieldCheck,
  Globe2,
  Code
} from 'lucide-react';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';
import { IntegrationsPanel } from './IntegrationsPanel';
import { SubscribersPanel } from './SubscribersPanel';
import { api, authStorage } from '../../../../services/api';
import { resolveTheme } from '../../../../utils/colorContrast';

export const SettingsPanel: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const {
    profile,
    setProfile,
    setCustomTheme,
    loadProfilesList,
    billingError,
    handleUpgradePlan,
    gaInput,
    setGaInput,
    metaPixelInput,
    setMetaPixelInput,
    isSavingPixels,
    pixelsSavedFeedback,
    pixelsError,
    handleSavePixels,
    customDomainInput,
    setCustomDomainInput,
    copiedCname,
    handleCopyCname,
    dnsVerificationResult,
    domainFeedback,
    isVerifyingDns,
    handleVerifyDns,
    isSavingDomain,
    handleSaveCustomDomain,
    customFontUrlInput,
    setCustomFontUrlInput,
    customCssInput,
    setCustomCssInput,
    stylingSavedFeedback,
    stylingError,
    isSavingStyling,
    handleSaveCustomStyling,
    shareTitleInput,
    setShareTitleInput,
    shareImageUrlInput,
    setShareImageUrlInput,
    shareDescriptionInput,
    setShareDescriptionInput,
    footerLogoUrlInput,
    setFooterLogoUrlInput,
    footerLogoLinkInput,
    setFooterLogoLinkInput,
    footerLogoAltInput,
    setFooterLogoAltInput,
    backgroundMediaUrlInput,
    setBackgroundMediaUrlInput,
    uploadingImage,
    handleBackgroundImageUpload,
    backgroundMediaTypeInput,
    setBackgroundMediaTypeInput,
    pageRedirectUrlInput,
    setPageRedirectUrlInput,
    pageRedirectUntilInput,
    setPageRedirectUntilInput,
    pageSettingsFeedback,
    isSavingPageSettings,
    handleSavePageSettings,
    formSubmissionTotal,
    formSubmissionsLoading,
    handleExportFormResponses,
    formSubmissionFilter,
    setFormSubmissionFilter,
    setFormSubmissionPage,
    formSubmissionPage,
    formSubmissionsError,
    refreshSubmissions,
    formSubmissions,
    handleDeleteFormSubmission,
    formSubmissionHasMore
  } = useBuilder();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Subscription Plan Card */}
      <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{ui("Membership & Subscription Plan")}</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {ui("Current tier:")}<strong className="uppercase font-mono text-neutral-900">{profile.plan || 'free'}</strong>
            </p>
          </div>
          <span className="px-3 py-1 bg-neutral-100 text-neutral-800 text-xs font-mono font-bold rounded-xl border border-neutral-200">
            {ui("ACTIVE")}
          </span>
        </div>

        {billingError && (
          <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {billingError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className={`p-4 rounded-xl border text-xs flex flex-col justify-between transition-colors ${
            (profile.plan || 'free') === 'free' ? 'border-neutral-900 ring-2 ring-neutral-900/10 bg-neutral-50' : 'border-neutral-200'
          }`}>
            <div>
              <div className="font-bold text-sm text-neutral-900">{ui("Free")}</div>
              <div className="text-neutral-500 text-[11px] mt-0.5">{ui("Core links, analytics & bio")}</div>
            </div>
            <button
              onClick={() => handleUpgradePlan('free')}
              disabled={(profile.plan || 'free') === 'free'}
              className="mt-3 py-1.5 px-3 rounded-lg border border-neutral-300 text-center font-semibold disabled:opacity-50 cursor-pointer hover:border-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 transition-colors"
            >
              {(profile.plan || 'free') === 'free' ? ui("Current Plan") : ui("Downgrade")}
            </button>
          </div>

          <div className={`p-4 rounded-xl border text-xs flex flex-col justify-between transition-colors ${
            profile.plan === 'pro' ? 'border-neutral-900 ring-2 ring-neutral-900/10 bg-neutral-50' : 'border-neutral-200'
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-neutral-900">{ui("Pro")}</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-mono font-bold px-1.5 py-0.5 rounded">{ui("POPULAR")}</span>
              </div>
              <div className="text-neutral-500 text-[11px] mt-0.5">{ui("Custom domain and branding controls")}</div>
            </div>
            <button
              onClick={() => handleUpgradePlan('pro')}
              disabled={profile.plan === 'pro'}
              className="mt-3 py-1.5 px-3 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 text-center font-semibold disabled:opacity-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 transition-colors"
            >
              {profile.plan === 'pro' ? ui("Current Plan") : ui("Select Pro")}
            </button>
          </div>

          <div className={`p-4 rounded-xl border text-xs flex flex-col justify-between transition-colors ${
            profile.plan === 'studio' ? 'border-neutral-900 ring-2 ring-neutral-900/10 bg-neutral-50' : 'border-neutral-200'
          }`}>
            <div>
              <div className="font-bold text-sm text-neutral-900">{ui("Studio")}</div>
              <div className="text-neutral-500 text-[11px] mt-0.5">{ui("Custom CSS and REST API")}</div>
            </div>
            <button
              onClick={() => handleUpgradePlan('studio')}
              disabled={profile.plan === 'studio'}
              className="mt-3 py-1.5 px-3 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 text-center font-semibold disabled:opacity-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 transition-colors"
            >
              {profile.plan === 'studio' ? ui("Current Plan") : ui("Select Studio")}
            </button>
          </div>
        </div>
      </div>

      {/* White-Label Branding Card */}
      <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-neutral-900">{ui("White-Label Branding")}</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {ui("Remove the \"Made with LIINX\" badge from your bio page and footer.")}
            </p>
          </div>
          {profile.plan === 'free' ? (
            <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-1 rounded-md">
              {ui("PRO FEATURE")}
            </span>
          ) : (
            <button
              type="button"
              onClick={async () => {
                const newHide = !profile.hideBranding;
                setProfile(prev => ({ ...prev, hideBranding: newHide }));
                try {
                  await api.studio.updateProfile({ hideBranding: newHide });
                } catch (err) {
                  console.error('Failed to update white label setting', err);
                }
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${
                profile.hideBranding ? 'bg-emerald-600' : 'bg-neutral-200'
              }`}
              role="switch"
              aria-checked={Boolean(profile.hideBranding)}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-neutral-50 shadow-lg ring-0 transition duration-200 ease-in-out ${
                  profile.hideBranding ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          )}
        </div>
        {profile.plan === 'free' && (
          <p className="text-[11px] text-neutral-400">
            {ui("Upgrade to Pro or Studio to completely remove all LIINX branding badges.")}
          </p>
        )}
      </div>

      {/* Google Analytics 4 & Meta Pixel Tracking Card */}
      <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-neutral-900">{ui("Analytics & Retargeting Pixels")}</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {ui("Connect your Google Analytics 4 Measurement ID and Meta Pixel to track visitors and run retargeting ads.")}
            </p>
          </div>
          {profile.plan === 'free' ? (
            <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-1 rounded-md">
              {ui("PRO FEATURE")}
            </span>
          ) : (
            <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-md">
              {ui("ACTIVE")}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <label htmlFor="settings-ga-id" className="text-xs font-semibold text-neutral-800">{ui("Google Analytics 4 Measurement ID")}</label>
            <input
              id="settings-ga-id"
              name="googleAnalyticsId"
              aria-label={ui("Google Analytics 4 Measurement ID")}
              type="text"
              disabled={profile.plan === 'free'}
              value={gaInput}
              onChange={e => setGaInput(e.target.value)}
              placeholder={ui("G-XXXXXXXXXX")}
              className="w-full text-xs font-mono p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-neutral-50 focus:border-neutral-900 outline-none transition-colors disabled:opacity-50"
            />
            <p className="text-[10px] text-neutral-400">{ui("Found in GA4 Admin > Data Streams > Measurement ID")}</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="settings-meta-pixel-id" className="text-xs font-semibold text-neutral-800">{ui("Meta (Facebook) Pixel ID")}</label>
            <input
              id="settings-meta-pixel-id"
              name="metaPixelId"
              aria-label={ui("Meta (Facebook) Pixel ID")}
              type="text"
              disabled={profile.plan === 'free'}
              value={metaPixelInput}
              onChange={e => setMetaPixelInput(e.target.value)}
              placeholder={ui("e.g. 123456789012345")}
              className="w-full text-xs font-mono p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-neutral-50 focus:border-neutral-900 outline-none transition-colors disabled:opacity-50"
            />
            <p className="text-[10px] text-neutral-400">{ui("Found in Meta Events Manager > Data Sources")}</p>
          </div>
        </div>

        {profile.plan !== 'free' && (
          <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
            <span className="text-xs font-medium">
              {pixelsSavedFeedback && <span className="text-emerald-600">{ui("✓ Pixel settings saved!")}</span>}
              {pixelsError && <span role="alert" className="text-rose-600">{pixelsError}</span>}
            </span>
            <button
              type="button"
              disabled={isSavingPixels}
              onClick={handleSavePixels}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
            >
              {isSavingPixels ? ui("Saving...") : ui("Save Tracking IDs")}
            </button>
          </div>
        )}
      </div>

      {/* Custom Domain Setup Card */}
      <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900">{ui("Custom Domain")}</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {ui("Link a verified domain or subdomain (e.g.")}<span className="font-mono">links.yourbrand.com</span>{ui(") after your hosting provider provisions HTTPS.")}
              </p>
            </div>
          </div>
          {profile.plan === 'free' ? (
            <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-1 rounded-md">
              {ui("PRO / STUDIO")}
            </span>
          ) : (
            <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-md">
              {profile.customDomainVerified ? ui("DNS VERIFIED") : ui("SETUP REQUIRED")}
            </span>
          )}
        </div>

        <div className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <label htmlFor="settings-custom-domain" className="text-xs font-semibold text-neutral-800">{ui("Domain / Subdomain Name")}</label>
            <input
              id="settings-custom-domain"
              name="customDomain"
              aria-label={ui("Domain / Subdomain Name")}
              type="text"
              disabled={profile.plan === 'free'}
              value={customDomainInput}
              onChange={e => setCustomDomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ''))}
              placeholder={ui("e.g. links.sarahcreator.com")}
              className="w-full text-xs font-mono p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-neutral-50 focus:border-neutral-900 outline-none transition-colors disabled:opacity-50"
            />
          </div>

          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-2.5 text-xs">
            <span className="font-bold text-neutral-900 block text-xs">
              {ui("How to connect your domain:")}
            </span>
            <ol className="space-y-1.5 text-[11px] text-neutral-600 list-decimal list-inside leading-relaxed">
              <li>{ui("Enter your subdomain above (e.g. links.yourdomain.com)")}</li>
              <li>
                {ui("In your DNS provider (Cloudflare, GoDaddy, etc.), add a ")}
                <span className="font-mono font-bold text-neutral-900">CNAME</span>
                {ui(" record pointing to:")}
              </li>
            </ol>
            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-neutral-200 font-mono text-xs shadow-2xs">
              <span className="font-bold text-neutral-800">liinx-app.fly.dev</span>
              <button
                type="button"
                onClick={handleCopyCname}
                className="text-[11px] text-amber-700 hover:text-amber-800 font-sans font-bold cursor-pointer transition-colors"
              >
                {copiedCname ? ui("Copied!") : ui("Copy Target")}
              </button>
            </div>
            <p className="text-[11px] leading-relaxed text-neutral-500 pt-1">
              {profile.customDomainVerified
                ? ui("✓ Domain connected successfully. Secure HTTPS becomes active once your hosting provider completes TLS certificate provisioning.")
                : ui("3. Click 'Verify DNS' below once your record is created. Connect your custom domain with guided DNS verification.")}
            </p>
          </div>

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
        </div>
      </div>

      {/* Custom CSS & Custom Font Card */}
      <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900">{ui("Custom CSS & Custom Webfonts")}</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {ui("Custom styles are limited to the public page; font stylesheets must use Google Fonts.")}
              </p>
            </div>
          </div>
          {profile.plan === 'free' ? (
            <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-1 rounded-md">
              {ui("PRO / STUDIO")}
            </span>
          ) : (
            <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-md">
              {ui("ACTIVE")}
            </span>
          )}
        </div>

        <div className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <label htmlFor="settings-custom-font-url" className="text-xs font-semibold text-neutral-800">{ui("Google Fonts / Webfont Stylesheet URL")}</label>
            <input
              id="settings-custom-font-url"
              name="customFontUrl"
              aria-label={ui("Google Fonts / Webfont Stylesheet URL")}
              type="url"
              disabled={profile.plan === 'free'}
              value={customFontUrlInput}
              onChange={e => setCustomFontUrlInput(e.target.value)}
              placeholder="https://fonts.googleapis.com/css2?family=Playfair+Display&display=swap"
              className="w-full text-xs font-mono p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-neutral-50 focus:border-neutral-900 outline-none transition-colors disabled:opacity-50"
            />
          </div>
          <p className="text-[11px] text-neutral-500">
            {ui("Unsupported imports, external URLs, and rules that can hide or cover controls are rejected.")}
          </p>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="settings-custom-css" className="text-xs font-semibold text-neutral-800">{ui("Custom CSS Overrides")}</label>
              <span className="text-[10px] font-mono text-neutral-400">{ui("Scoped to #public-bio-view")}</span>
            </div>
            <textarea
              id="settings-custom-css"
              name="customCss"
              aria-label={ui("/* Custom CSS overrides */\n#public-bio-view .custom-card { border-width: 2px; }")}
              rows={4}
              disabled={profile.plan === 'free'}
              value={customCssInput}
              onChange={e => setCustomCssInput(e.target.value)}
              placeholder={ui("/* Custom CSS overrides */\n#public-bio-view .custom-card { border-width: 2px; }")}
              className="w-full text-xs font-mono p-3 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-neutral-50 focus:border-neutral-900 outline-none transition-colors disabled:opacity-50"
            />
          </div>

          {profile.plan !== 'free' && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-medium">
                {stylingSavedFeedback && <span className="text-emerald-600">{ui("✓ Custom styling saved!")}</span>}
                {stylingError && <span role="alert" className="text-rose-600">{stylingError}</span>}
              </span>
              <button
                type="button"
                disabled={isSavingStyling}
                onClick={handleSaveCustomStyling}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSavingStyling ? ui("Saving...") : ui("Save Custom CSS & Fonts")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Public Page Controls */}
      <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-sm text-neutral-900">{ui('Public Page Controls')}</h3>
          <p className="text-xs text-neutral-500 mt-0.5">{ui('Control how your page appears when shared and what visitors see in the background.')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label htmlFor="settings-share-title" className="text-xs font-semibold text-neutral-800">
            {ui('Share title')}
            <input
              id="settings-share-title"
              name="shareTitle"
              value={shareTitleInput}
              onChange={e => setShareTitleInput(e.target.value)}
              maxLength={160}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900"
              placeholder={profile.displayName}
            />
          </label>
          <label htmlFor="settings-share-image-url" className="text-xs font-semibold text-neutral-800">
            {ui('Share image URL')}
            <input
              id="settings-share-image-url"
              name="shareImageUrl"
              type="url"
              value={shareImageUrlInput}
              onChange={e => setShareImageUrlInput(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900"
              placeholder="https://..."
            />
          </label>
          <label htmlFor="settings-share-description" className="sm:col-span-2 text-xs font-semibold text-neutral-800">
            {ui('Share description')}
            <textarea
              id="settings-share-description"
              name="shareDescription"
              value={shareDescriptionInput}
              onChange={e => setShareDescriptionInput(e.target.value)}
              maxLength={300}
              rows={2}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900"
            />
          </label>
          <label htmlFor="settings-footer-logo-url" className="text-xs font-semibold text-neutral-800">
            {ui('Footer logo URL')}
            <input
              id="settings-footer-logo-url"
              name="footerLogoUrl"
              type="url"
              disabled={profile.plan === 'free'}
              value={footerLogoUrlInput}
              onChange={e => setFooterLogoUrlInput(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900 disabled:opacity-50"
              placeholder="https://..."
            />
          </label>
          <label htmlFor="settings-footer-logo-destination" className="text-xs font-semibold text-neutral-800">
            {ui('Footer logo destination')}
            <input
              id="settings-footer-logo-destination"
              name="footerLogoDestination"
              type="url"
              disabled={profile.plan === 'free'}
              value={footerLogoLinkInput}
              onChange={e => setFooterLogoLinkInput(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900 disabled:opacity-50"
              placeholder="https://..."
            />
          </label>
          <label htmlFor="settings-footer-logo-alt" className="sm:col-span-2 text-xs font-semibold text-neutral-800">
            {ui('Footer logo accessible name')}
            <input
              id="settings-footer-logo-alt"
              name="footerLogoAlt"
              type="text"
              disabled={profile.plan === 'free'}
              value={footerLogoAltInput}
              onChange={e => setFooterLogoAltInput(e.target.value)}
              maxLength={120}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900 disabled:opacity-50"
              placeholder={profile.displayName}
            />
          </label>
          <label htmlFor="settings-background-media-url" className="text-xs font-semibold text-neutral-800">
            {ui('Background media URL')}
            <input
              id="settings-background-media-url"
              name="backgroundMediaUrl"
              type="url"
              disabled={profile.plan === 'free'}
              value={backgroundMediaUrlInput}
              onChange={e => setBackgroundMediaUrlInput(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900 disabled:opacity-50"
              placeholder="https://..."
            />
          </label>
          <label htmlFor="settings-upload-bg-image" className="text-xs font-semibold text-neutral-800">
            {ui('Upload background image')}
            <input
              id="settings-upload-bg-image"
              name="uploadBackgroundImage"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={profile.plan === 'free' || uploadingImage}
              onChange={event => {
                const file = event.target.files?.[0];
                if (file) void handleBackgroundImageUpload(file);
                event.currentTarget.value = '';
              }}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs font-normal text-neutral-900 disabled:opacity-50"
            />
            {profile.plan === 'free' && (
              <span className="mt-1 block text-[11px] font-normal text-neutral-500">
                {ui('Background media requires a paid plan.')}
              </span>
            )}
          </label>
          <label htmlFor="settings-background-media-type" className="text-xs font-semibold text-neutral-800">
            {ui('Background type')}
            <select
              id="settings-background-media-type"
              name="backgroundMediaType"
              disabled={profile.plan === 'free'}
              value={backgroundMediaTypeInput}
              onChange={e => setBackgroundMediaTypeInput(e.target.value as 'image' | 'video')}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900 disabled:opacity-50"
            >
              <option value="image">{ui('Image')}</option>
              <option value="video">{ui('Video')}</option>
            </select>
          </label>
          <label htmlFor="settings-page-redirect-url" className="text-xs font-semibold text-neutral-800">
            {ui('Temporary page redirect')}
            <input
              id="settings-page-redirect-url"
              name="pageRedirectUrl"
              type="url"
              value={pageRedirectUrlInput}
              onChange={e => setPageRedirectUrlInput(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900"
              placeholder="https://..."
            />
          </label>
          <label htmlFor="settings-page-redirect-until" className="text-xs font-semibold text-neutral-800">
            {ui('Redirect ends')}
            <input
              id="settings-page-redirect-until"
              name="pageRedirectUntil"
              type="datetime-local"
              value={pageRedirectUntilInput}
              onChange={e => setPageRedirectUntilInput(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900"
            />
            <span className="mt-1 block text-[10px] font-normal text-neutral-500">
              {ui('Times use this browser timezone and are saved as UTC instants. The redirect expires at the selected time.')}
            </span>
          </label>
        </div>
        {profile.plan === 'free' && (
          <p className="text-[11px] text-neutral-500" role="note">
            {ui('Background media is unavailable on the free plan. Existing media is hidden publicly until the plan is upgraded.')}
          </p>
        )}
        {pageSettingsFeedback && <p role="status" className="text-xs text-emerald-700">{pageSettingsFeedback}</p>}
        <button
          type="button"
          disabled={isSavingPageSettings}
          onClick={handleSavePageSettings}
          className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          {isSavingPageSettings ? ui('Saving...') : ui('Save Public Page Settings')}
        </button>
      </div>

      {/* Duplicate Profile and Form Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-neutral-900">{ui('Duplicate this profile')}</h3>
          <p className="text-xs text-neutral-500">{ui('Create another profile with the same content and design, then choose a new handle.')}</p>
          <button
            type="button"
            onClick={async () => {
              const username = window.prompt(ui('New username'));
              if (!username) return;
              const displayName = window.prompt(ui('Display name'), profile.displayName) || profile.displayName;
              try {
                const result = await api.studio.createProfile({ username, displayName, duplicateProfileId: profile.id });
                authStorage.setToken(result.token);
                const next = await api.studio.getProfile();
                setProfile(next);
                setCustomTheme(resolveTheme(next.themeId, next.customTheme));
                loadProfilesList();
              } catch (error) {
                console.error('Could not duplicate profile', error);
              }
            }}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-xs font-bold text-neutral-900 hover:border-neutral-900"
          >
            {ui('Duplicate Profile')}
          </button>
        </div>

        <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-neutral-900">{ui('Form submissions')}</h3>
              <p className="text-xs text-neutral-500">
                {formSubmissionTotal ? `${formSubmissionTotal} ${ui('stored responses')}` : ui('No form responses yet.')}
              </p>
            </div>
            <button
              type="button"
              disabled={formSubmissionsLoading || formSubmissionTotal === 0}
              onClick={() => void handleExportFormResponses()}
              className="rounded-lg border border-neutral-300 px-2.5 py-1.5 text-[11px] font-semibold text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {ui('Export responses CSV')}
            </button>
          </div>

          <label htmlFor="settings-form-submission-filter" className="block text-[11px] font-semibold text-neutral-700">
            {ui('Filter by form')}
            <select
              id="settings-form-submission-filter"
              name="formSubmissionFilter"
              value={formSubmissionFilter}
              onChange={event => {
                setFormSubmissionFilter(event.target.value);
                setFormSubmissionPage(1);
              }}
              className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-[11px] font-normal text-neutral-900"
            >
              <option value="">{ui('All forms')}</option>
              {profile.blocks.filter(block => block.type === 'form').map(block => (
                <option key={block.id} value={block.id}>{block.title}</option>
              ))}
            </select>
          </label>

          {formSubmissionsLoading ? (
            <p role="status" className="py-6 text-center text-xs text-neutral-500">{ui('Loading form responses...')}</p>
          ) : formSubmissionsError ? (
            <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              <p>{formSubmissionsError}</p>
              <button type="button" onClick={refreshSubmissions} className="mt-2 font-semibold underline">
                {ui('Retry')}
              </button>
            </div>
          ) : formSubmissions.length === 0 ? (
            <p role="status" className="py-6 text-center text-xs text-neutral-500">
              {formSubmissionTotal ? ui('No responses on this page.') : ui('No form responses yet.')}
            </p>
          ) : (
            <div className="max-h-96 space-y-2 overflow-auto">
              {formSubmissions.map(item => (
                <article key={item.id} className="rounded-xl border border-neutral-200 bg-white p-3 text-[11px] text-neutral-700">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-neutral-900">{item.formTitle}</p>
                      <time className="font-mono text-neutral-400" dateTime={new Date(item.createdAt).toISOString()}>
                        {new Date(item.createdAt).toLocaleString()}
                      </time>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDeleteFormSubmission(item.id)}
                      aria-label={`${ui('Delete response')} ${item.formTitle}`}
                      className="text-rose-700 underline"
                    >
                      {ui('Delete')}
                    </button>
                  </div>
                  <dl className="mt-2 space-y-1">
                    {Object.entries(item.fields).map(([name, value]) => (
                      <div key={name} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2">
                        <dt className="font-semibold break-words">{item.fieldLabels[name] || name}</dt>
                        <dd className="whitespace-pre-wrap break-words">{value || '—'}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 border-t border-neutral-200 pt-2 text-[11px] text-neutral-500">
            <span>{formSubmissionTotal ? `${ui('Page')} ${formSubmissionPage} · ${formSubmissionTotal} ${ui('total')}` : ''}</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={formSubmissionsLoading || formSubmissionPage <= 1}
                onClick={() => setFormSubmissionPage(page => Math.max(1, page - 1))}
                className="rounded border border-neutral-300 px-2 py-1 font-semibold disabled:opacity-40"
              >
                {ui('Previous')}
              </button>
              <button
                type="button"
                disabled={formSubmissionsLoading || !formSubmissionHasMore}
                onClick={() => setFormSubmissionPage(page => page + 1)}
                className="rounded border border-neutral-300 px-2 py-1 font-semibold disabled:opacity-40"
              >
                {ui('Next')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Integrations Panel (REST API & Instagram Auto-Sync) */}
      <IntegrationsPanel />

      {/* Subscribers Panel */}
      <SubscribersPanel />
    </div>
  );
};
