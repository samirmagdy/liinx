import { useState } from 'react';
import { type CreatorProfile } from '../../../types';

/**
 * Every Settings field that mirrors a stored profile column, in one place, so the builder
 * provider stays about orchestration rather than holding thirty-odd inputs.
 */
export function useStudioSettingsInputs() {
  const [gaInput, setGaInput] = useState('');
  const [metaPixelInput, setMetaPixelInput] = useState('');
  const [isSavingPixels, setIsSavingPixels] = useState(false);
  const [pixelsSavedFeedback, setPixelsSavedFeedback] = useState(false);
  const [pixelsError, setPixelsError] = useState<string | null>(null);

  const [customDomainInput, setCustomDomainInput] = useState('');
  const [isVerifyingDns, setIsVerifyingDns] = useState(false);
  const [dnsVerificationResult, setDnsVerificationResult] = useState<{ verified: boolean; message: string } | null>(null);
  const [isSavingDomain, setIsSavingDomain] = useState(false);
  const [copiedCname, setCopiedCname] = useState(false);
  const [domainFeedback, setDomainFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [customCssInput, setCustomCssInput] = useState('');
  const [customFontUrlInput, setCustomFontUrlInput] = useState('');
  const [shareTitleInput, setShareTitleInput] = useState('');
  const [shareDescriptionInput, setShareDescriptionInput] = useState('');
  const [shareImageUrlInput, setShareImageUrlInput] = useState('');
  const [footerLogoUrlInput, setFooterLogoUrlInput] = useState('');
  const [footerLogoLinkInput, setFooterLogoLinkInput] = useState('');
  const [footerLogoAltInput, setFooterLogoAltInput] = useState('');
  const [backgroundMediaUrlInput, setBackgroundMediaUrlInput] = useState('');
  const [backgroundMediaTypeInput, setBackgroundMediaTypeInput] = useState<'image' | 'video'>('image');
  const [pageRedirectUrlInput, setPageRedirectUrlInput] = useState('');
  const [pageRedirectUntilInput, setPageRedirectUntilInput] = useState('');
  const [isSavingPageSettings, setIsSavingPageSettings] = useState(false);
  const [pageSettingsFeedback, setPageSettingsFeedback] = useState<string | null>(null);
  const [isSavingStyling, setIsSavingStyling] = useState(false);
  const [stylingSavedFeedback, setStylingSavedFeedback] = useState(false);
  const [stylingError, setStylingError] = useState<string | null>(null);

  const syncSettingsState = (p: CreatorProfile) => {
    setGaInput(p.gaMeasurementId || '');
    setMetaPixelInput(p.metaPixelId || '');
    setCustomDomainInput(p.customDomain || '');
    setCustomCssInput(p.customCss || '');
    setCustomFontUrlInput(p.customFontUrl || '');
    setShareTitleInput(p.shareTitle || '');
    setShareDescriptionInput(p.shareDescription || '');
    setShareImageUrlInput(p.shareImageUrl || '');
    setFooterLogoUrlInput(p.footerLogoUrl || '');
    setFooterLogoLinkInput(p.footerLogoLink || '');
    setFooterLogoAltInput(p.footerLogoAlt || '');
    setBackgroundMediaUrlInput(p.backgroundMediaUrl || '');
    setBackgroundMediaTypeInput((p.backgroundMediaType as 'image' | 'video') || 'image');
    setPageRedirectUrlInput(p.pageRedirectUrl || '');
    setPageRedirectUntilInput(p.pageRedirectUntil ? new Date(p.pageRedirectUntil).toISOString().slice(0, 16) : '');
  };

  return {
    gaInput, setGaInput,
    metaPixelInput, setMetaPixelInput,
    isSavingPixels, setIsSavingPixels,
    pixelsSavedFeedback, setPixelsSavedFeedback,
    pixelsError, setPixelsError,
    customDomainInput, setCustomDomainInput,
    isVerifyingDns, setIsVerifyingDns,
    dnsVerificationResult, setDnsVerificationResult,
    isSavingDomain, setIsSavingDomain,
    copiedCname, setCopiedCname,
    domainFeedback, setDomainFeedback,
    customCssInput, setCustomCssInput,
    customFontUrlInput, setCustomFontUrlInput,
    shareTitleInput, setShareTitleInput,
    shareDescriptionInput, setShareDescriptionInput,
    shareImageUrlInput, setShareImageUrlInput,
    footerLogoUrlInput, setFooterLogoUrlInput,
    footerLogoLinkInput, setFooterLogoLinkInput,
    footerLogoAltInput, setFooterLogoAltInput,
    backgroundMediaUrlInput, setBackgroundMediaUrlInput,
    backgroundMediaTypeInput, setBackgroundMediaTypeInput,
    pageRedirectUrlInput, setPageRedirectUrlInput,
    pageRedirectUntilInput, setPageRedirectUntilInput,
    isSavingPageSettings, setIsSavingPageSettings,
    pageSettingsFeedback, setPageSettingsFeedback,
    isSavingStyling, setIsSavingStyling,
    stylingSavedFeedback, setStylingSavedFeedback,
    stylingError, setStylingError,
    syncSettingsState
  };
}
