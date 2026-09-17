import React, { createContext, useContext, useState, useRef, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import { type CreatorProfile, type ThemeConfig, type ProfileBlock, type CreatorPage, type SocialLink } from '../../../types';
import { resolveTheme } from '../../../utils/colorContrast';
import { api } from '../../../services/api';
import { friendlyErrorMessage } from '../../../utils/errors';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';
import confetti from 'canvas-confetti';
import {
  type BuilderTab,
  type PreviewDevice,
  type AnalyticsData,
  type SubscriberItem,
  type InstagramStatus,
  type ProfileSummary,
  type ApiKeyItem,
  type FormSubmissionItem,
  type BuilderLoadState
} from '../types/builder.types';
import { useAutosave } from '../hooks/useAutosave';
import { useProfile, EMPTY_BUILDER_PROFILE } from '../hooks/useProfile';
import { usePages } from '../hooks/usePages';
import { useBlocks } from '../hooks/useBlocks';
import { useUploads } from '../hooks/useUploads';
import { useSocialLinks } from '../hooks/useSocialLinks';
import { useAnalytics } from '../hooks/useAnalytics';
import { useSubscribers } from '../hooks/useSubscribers';
import { useInstagramIntegration } from '../hooks/useInstagramIntegration';
import { useApiKeys } from '../hooks/useApiKeys';
import { useFormSubmissions } from '../hooks/useFormSubmissions';

export interface BuilderContextType {
  // Tabs & Layout
  activeTab: BuilderTab;
  setActiveTab: (tab: BuilderTab) => void;
  previewDevice: PreviewDevice;
  setPreviewDevice: (device: PreviewDevice) => void;
  qrModalOpen: boolean;
  setQrModalOpen: (open: boolean) => void;
  copiedLink: boolean;
  handleCopyPublicLink: () => void;

  // Profile & Theme
  profile: CreatorProfile;
  setProfile: Dispatch<SetStateAction<CreatorProfile>>;
  profileRef: React.MutableRefObject<CreatorProfile>;
  customTheme: ThemeConfig;
  setCustomTheme: (theme: ThemeConfig) => void;
  loadState: BuilderLoadState;
  profileList: ProfileSummary[];
  profileDropdownOpen: boolean;
  setProfileDropdownOpen: (open: boolean) => void;
  profileSwitchError: string | null;
  setProfileSwitchError: (err: string | null) => void;
  showNewProfileModal: boolean;
  setShowNewProfileModal: (open: boolean) => void;
  newUsername: string;
  setNewUsername: (name: string) => void;
  newDisplayName: string;
  setNewDisplayName: (name: string) => void;
  isCreatingProfile: boolean;
  createProfileError: string | null;
  usernameCheck: { loading: boolean; error: string | null };
  deleteProfileId: string | null;
  setDeleteProfileId: (id: string | null) => void;
  billingError: string | null;
  showImporterModal: boolean;
  setShowImporterModal: (open: boolean) => void;
  handleProfileChange: (field: keyof CreatorProfile, value: any) => void;
  handleSelectProfile: (id: string) => Promise<void>;
  handleCreateProfileSubmit: (e: React.FormEvent) => Promise<void>;
  handleDeleteProfile: (id: string) => Promise<void>;
  handleUsernameBlur: () => Promise<void>;
  handleUpgradePlan: (plan: 'free' | 'pro' | 'studio') => Promise<void>;
  handleThemeSelect: (theme: ThemeConfig) => void;
  updateThemeOverride: (patch: Partial<ThemeConfig>) => void;
  loadProfilesList: () => void;

  // Autosave & Status
  saveStatus: 'saved' | 'saving' | 'error';
  saveErrorBanner: string | null;
  handleRetryFailedSaves: () => void;
  queueRef: React.MutableRefObject<any>;
  flushQueue: () => Promise<boolean>;

  // Pages
  pages: CreatorPage[];
  activePage?: CreatorPage;
  activePageId: string;
  setActivePageId: (id: string) => void;
  newPageTitle: string;
  setNewPageTitle: (title: string) => void;
  newPageSlug: string;
  setNewPageSlug: (slug: string) => void;
  pageEditTitle: string;
  setPageEditTitle: (title: string) => void;
  pageEditSlug: string;
  setPageEditSlug: (slug: string) => void;
  pageEditDescription: string;
  setPageEditDescription: (desc: string) => void;
  pageEditPublished: boolean;
  setPageEditPublished: (pub: boolean) => void;
  isSavingPage: boolean;
  pageManagerError: string | null;
  deletePageId: string | null;
  setDeletePageId: (id: string | null) => void;
  handleCreatePage: () => Promise<void>;
  handleDeletePage: (id: string) => Promise<void>;
  handleSavePage: () => Promise<void>;
  handleMovePage: (direction: -1 | 1) => Promise<void>;
  handleMoveBlockToPage: (blockId: string, pageId: string) => Promise<void>;

  // Blocks
  visibleBlocks: ProfileBlock[];
  showAddMenu: boolean;
  setShowAddMenu: (show: boolean) => void;
  confirmDeleteBlockId: string | null;
  setConfirmDeleteBlockId: (id: string | null) => void;
  handleAddLink: () => Promise<void>;
  handleAddHeader: () => Promise<void>;
  handleAddAudio: () => Promise<void>;
  handleAddVideo: () => Promise<void>;
  handleAddFolder: () => Promise<void>;
  handleAddNewsletter: () => Promise<void>;
  handleAddAdvancedBlock: (type: string) => Promise<void>;
  handleAddBookingBlock: (title: string, url: string) => Promise<void>;
  handleMoveBlock: (index: number, direction: 'up' | 'down') => Promise<void>;
  handleDuplicateBlock: (blockId: string) => Promise<void>;
  handleDeleteBlock: (id: string) => Promise<void>;
  handleUpdateBlockField: (id: string, field: string, value: any) => void;
  handleUpdateBlockExtra: (id: string, extraUpdates: Record<string, any>) => void;
  handleAddFolderItem: (blockId: string) => void;
  handleMoveFolderItem: (blockId: string, itemId: string, direction: -1 | 1) => void;
  handleRemoveFolderItem: (blockId: string, itemId: string) => void;
  handleUpdateFolderItem: (blockId: string, itemId: string, field: 'title' | 'url', val: string) => void;

  // Uploads
  uploadingImage: boolean;
  avatarError: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleAvatarFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleBlockImageUpload: (blockId: string, file: File, field?: string, itemIndex?: number, itemId?: string) => Promise<void>;
  handleBlockFileUpload: (blockId: string, file: File) => Promise<void>;
  handleBackgroundImageUpload: (file: File) => Promise<void>;

  // Social
  newSocialPlatform: SocialLink['platform'];
  setNewSocialPlatform: (p: SocialLink['platform']) => void;
  newSocialUrl: string;
  setNewSocialUrl: (url: string) => void;
  socialError: string | null;
  socialDrafts: Record<number, string>;
  setSocialDrafts: Dispatch<SetStateAction<Record<number, string>>>;
  handleAddSocial: () => void;
  handleEditSocial: (index: number, value: string) => void;
  handleMoveSocial: (index: number, direction: -1 | 1) => void;
  handleRemoveSocial: (index: number) => void;

  // Analytics
  analyticsData: AnalyticsData | null;
  analyticsLoading: boolean;
  dataError: boolean;

  // Subscribers
  subscribers: SubscriberItem[];
  subscribersLoading: boolean;
  subscribersError: string | null;
  handleExportCsv: () => Promise<void>;
  handleDeleteSubscriber: (id: string) => Promise<void>;

  // Instagram
  instagramStatus: InstagramStatus | null;
  isSyncingInstagram: boolean;
  instagramCaptionInput: string;
  setInstagramCaptionInput: (val: string) => void;
  isTestingCaption: boolean;
  instagramFeedback: { type: 'success' | 'error'; message: string } | null;
  setInstagramFeedback: (val: { type: 'success' | 'error'; message: string } | null) => void;
  handleConnectInstagram: () => Promise<void>;
  handleSyncInstagramNow: () => Promise<void>;
  handleToggleInstagramAutoSync: () => Promise<void>;
  handleDisconnectInstagram: () => Promise<void>;
  handleTestCaptionExtract: (saveToProfile: boolean) => Promise<void>;

  // API Keys
  apiKeyList: ApiKeyItem[];
  showNewKeyModal: boolean;
  setShowNewKeyModal: (show: boolean) => void;
  newKeyName: string;
  setNewKeyName: (name: string) => void;
  createdApiKey: string | null;
  setCreatedApiKey: (key: string | null) => void;
  isGeneratingKey: boolean;
  generateKeyError: string | null;
  copiedKey: boolean;
  confirmRevokeKeyId: string | null;
  setConfirmRevokeKeyId: (id: string | null) => void;
  apiKeyError: string | null;
  handleGenerateApiKeySubmit: (e: React.FormEvent) => Promise<void>;
  handleRevokeApiKey: (keyId: string) => Promise<void>;
  handleCopyKey: (key: string) => Promise<void>;

  // Form Submissions
  formSubmissions: FormSubmissionItem[];
  formSubmissionPage: number;
  setFormSubmissionPage: Dispatch<SetStateAction<number>>;
  formSubmissionTotal: number;
  formSubmissionHasMore: boolean;
  formSubmissionFilter: string;
  setFormSubmissionFilter: (filter: string) => void;
  formSubmissionsLoading: boolean;
  formSubmissionsError: string | null;
  handleExportFormResponses: () => Promise<void>;
  handleDeleteFormSubmission: (id: string) => Promise<void>;
  refreshSubmissions: () => void;

  // Settings inputs
  gaInput: string;
  setGaInput: (val: string) => void;
  metaPixelInput: string;
  setMetaPixelInput: (val: string) => void;
  isSavingPixels: boolean;
  pixelsSavedFeedback: boolean;
  pixelsError: string | null;
  handleSavePixels: () => Promise<void>;

  customDomainInput: string;
  setCustomDomainInput: (val: string) => void;
  isVerifyingDns: boolean;
  dnsVerificationResult: { verified: boolean; message: string } | null;
  isSavingDomain: boolean;
  copiedCname: boolean;
  domainFeedback: { type: 'success' | 'error'; message: string } | null;
  handleVerifyDns: () => Promise<void>;
  handleSaveCustomDomain: () => Promise<void>;
  handleCopyCname: () => void;

  customCssInput: string;
  setCustomCssInput: (val: string) => void;
  customFontUrlInput: string;
  setCustomFontUrlInput: (val: string) => void;
  shareTitleInput: string;
  setShareTitleInput: (val: string) => void;
  shareDescriptionInput: string;
  setShareDescriptionInput: (val: string) => void;
  shareImageUrlInput: string;
  setShareImageUrlInput: (val: string) => void;
  footerLogoUrlInput: string;
  setFooterLogoUrlInput: (val: string) => void;
  footerLogoLinkInput: string;
  setFooterLogoLinkInput: (val: string) => void;
  footerLogoAltInput: string;
  setFooterLogoAltInput: (val: string) => void;
  backgroundMediaUrlInput: string;
  setBackgroundMediaUrlInput: (val: string) => void;
  backgroundMediaTypeInput: 'image' | 'video';
  setBackgroundMediaTypeInput: (val: 'image' | 'video') => void;
  pageRedirectUrlInput: string;
  setPageRedirectUrlInput: (val: string) => void;
  pageRedirectUntilInput: string;
  setPageRedirectUntilInput: (val: string) => void;
  isSavingPageSettings: boolean;
  pageSettingsFeedback: string | null;
  handleSavePageSettings: () => Promise<void>;
  isSavingStyling: boolean;
  stylingSavedFeedback: boolean;
  stylingError: string | null;
  handleSaveCustomStyling: () => Promise<void>;

  // Callbacks
  onViewFullscreen: (profile: CreatorProfile, theme: ThemeConfig) => void;
}

const BuilderContext = createContext<BuilderContextType | null>(null);

export function useBuilder(): BuilderContextType {
  const context = useContext(BuilderContext);
  if (!context) {
    throw new Error('useBuilder must be used within a BuilderProvider');
  }
  return context;
}

interface BuilderProviderProps {
  initialProfile?: CreatorProfile;
  onViewFullscreen: (profile: CreatorProfile, theme: ThemeConfig) => void;
  children: ReactNode;
}

export const BuilderProvider: React.FC<BuilderProviderProps> = ({
  initialProfile,
  onViewFullscreen,
  children
}) => {
  const { tr: ui } = useUiLanguage();
  const [activeTab, setActiveTab] = useState<BuilderTab>('content');
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('mobile');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Profile ref bridge
  const profileRef = useRef<CreatorProfile>(initialProfile || EMPTY_BUILDER_PROFILE);

  // Settings inputs state
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

  // 1. Profile hook
  const profileHook = useProfile({
    initialProfile,
    triggerAutoSave: patch => autosaveHook.triggerAutoSave(patch),
    flushQueue: () => autosaveHook.flushQueue(),
    onProfileSwitched: newP => {
      syncSettingsState(newP);
      pagesHook.setActivePageId(
        newP.pages?.find(page => page.isHome)?.id || newP.pages?.[0]?.id || ''
      );
    }
  });

  // Keep profileRef in sync
  profileRef.current = profileHook.profile;

  // 2. Autosave hook
  const autosaveHook = useAutosave({
    profileRef,
    setProfile: profileHook.setProfile
  });

  // 3. Pages hook
  const pagesHook = usePages({
    profile: profileHook.profile,
    setProfile: profileHook.setProfile,
    flushQueue: () => autosaveHook.flushQueue(),
    setSaveStatus: autosaveHook.setSaveStatus
  });

  // 4. Blocks hook
  const blocksHook = useBlocks({
    profile: profileHook.profile,
    profileRef,
    setProfile: profileHook.setProfile,
    activePage: pagesHook.activePage,
    enqueueBlockSave: (id, patch) => autosaveHook.enqueueBlockSave(id, patch),
    flushQueue: () => autosaveHook.flushQueue(),
    setSaveStatus: autosaveHook.setSaveStatus,
    setDataError: () => {}
  });

  // 5. Uploads hook
  const uploadsHook = useUploads({
    profile: profileHook.profile,
    profileRef,
    setProfile: profileHook.setProfile,
    triggerAutoSave: patch => autosaveHook.triggerAutoSave(patch),
    enqueueBlockSave: (id, patch) => autosaveHook.enqueueBlockSave(id, patch),
    flushQueue: () => autosaveHook.flushQueue(),
    setSaveStatus: autosaveHook.setSaveStatus,
    setSaveErrorBanner: autosaveHook.setSaveErrorBanner,
    setBackgroundMediaUrlInput,
    setBackgroundMediaTypeInput,
    setPageSettingsFeedback
  });

  // 6. Social links hook
  const socialLinksHook = useSocialLinks({
    profile: profileHook.profile,
    setProfile: profileHook.setProfile,
    triggerAutoSave: patch => autosaveHook.triggerAutoSave(patch)
  });

  // 7. Analytics hook
  const analyticsHook = useAnalytics({
    activeTab,
    profileId: profileHook.profile.id
  });

  // 8. Subscribers hook
  const subscribersHook = useSubscribers({
    activeTab,
    profileId: profileHook.profile.id,
    username: profileHook.profile.username
  });

  // 9. Instagram integration hook
  const instagramHook = useInstagramIntegration({
    activeTab,
    profile: profileHook.profile,
    setProfile: profileHook.setProfile,
    activePageId: pagesHook.activePageId,
    setActivePageId: pagesHook.setActivePageId,
    setDataError: () => {}
  });

  // 10. API keys hook
  const apiKeysHook = useApiKeys({
    activeTab,
    plan: profileHook.profile.plan || 'free'
  });

  // 11. Form submissions hook
  const formSubmissionsHook = useFormSubmissions({
    activeTab,
    profileId: profileHook.profile.id
  });

  const handleCopyPublicLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/@${profileHook.profile.username}`);
    } catch {
      autosaveHook.setSaveErrorBanner(ui('Could not copy link. Copy the address from the live page.'));
      return;
    }
    setCopiedLink(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.3 }
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const updateThemeOverride = (patch: Partial<ThemeConfig>) => {
    const updatedTheme = resolveTheme(profileHook.profile.themeId, {
      ...profileHook.customTheme,
      ...patch
    });
    profileHook.setCustomTheme(updatedTheme);
    profileHook.setProfile(previous => ({ ...previous, customTheme: updatedTheme }));
    autosaveHook.triggerAutoSave({ customTheme: updatedTheme });
  };

  const handleSavePixels = async () => {
    setIsSavingPixels(true);
    setPixelsError(null);
    try {
      await api.studio.updateProfile({
        gaMeasurementId: gaInput.trim() || null,
        metaPixelId: metaPixelInput.trim() || null
      });
      profileHook.setProfile(prev => ({
        ...prev,
        gaMeasurementId: gaInput.trim() || null,
        metaPixelId: metaPixelInput.trim() || null
      }));
      setPixelsSavedFeedback(true);
      setPixelsError(null);
      setTimeout(() => setPixelsSavedFeedback(false), 3000);
    } catch (err: any) {
      setPixelsError(friendlyErrorMessage(err, ui('Failed to save pixel settings')));
      setPixelsSavedFeedback(false);
    } finally {
      setIsSavingPixels(false);
    }
  };

  const handleVerifyDns = async () => {
    setIsVerifyingDns(true);
    setDnsVerificationResult(null);
    try {
      const res = await api.studio.verifyCustomDomain(customDomainInput.trim());
      setDnsVerificationResult({
        verified: res.verified,
        message: res.message
      });
    } catch (err: any) {
      setDnsVerificationResult({
        verified: false,
        message: friendlyErrorMessage(
          err,
          'We could not verify the domain right now. Check your DNS records and try again.'
        )
      });
    } finally {
      setIsVerifyingDns(false);
    }
  };

  const handleSaveCustomDomain = async () => {
    setIsSavingDomain(true);
    setDomainFeedback(null);
    try {
      const val = customDomainInput.trim() || null;
      await api.studio.updateProfile({ customDomain: val });
      profileHook.setProfile(prev => ({
        ...prev,
        customDomain: val,
        customDomainVerified: val === prev.customDomain ? prev.customDomainVerified : false,
        customDomainTlsStatus: val ? 'external_provider_required' : 'unknown'
      }));
      setDomainFeedback({
        type: 'success',
        message: ui('Custom domain saved successfully!')
      });
      setTimeout(() => setDomainFeedback(null), 4000);
    } catch (err: any) {
      setDomainFeedback({
        type: 'error',
        message: friendlyErrorMessage(err, ui('Failed to save custom domain'))
      });
    } finally {
      setIsSavingDomain(false);
    }
  };

  const handleCopyCname = () => {
    navigator.clipboard?.writeText('liinx-app.fly.dev');
    setCopiedCname(true);
    setTimeout(() => setCopiedCname(false), 2000);
  };

  const handleSaveCustomStyling = async () => {
    setIsSavingStyling(true);
    setStylingError(null);
    try {
      await api.studio.updateProfile({
        customCss: customCssInput.trim() || null,
        customFontUrl: customFontUrlInput.trim() || null
      });
      profileHook.setProfile(prev => ({
        ...prev,
        customCss: customCssInput.trim() || null,
        customFontUrl: customFontUrlInput.trim() || null
      }));
      setStylingSavedFeedback(true);
      setStylingError(null);
      setTimeout(() => setStylingSavedFeedback(false), 3000);
    } catch (err: any) {
      setStylingError(friendlyErrorMessage(err, ui('Failed to save styling')));
      setStylingSavedFeedback(false);
    } finally {
      setIsSavingStyling(false);
    }
  };

  const handleSavePageSettings = async () => {
    setIsSavingPageSettings(true);
    setPageSettingsFeedback(null);
    try {
      const data = {
        shareTitle: shareTitleInput.trim() || null,
        shareDescription: shareDescriptionInput.trim() || null,
        shareImageUrl: shareImageUrlInput.trim() || null,
        footerLogoUrl: footerLogoUrlInput.trim() || null,
        footerLogoLink: footerLogoLinkInput.trim() || null,
        footerLogoAlt: footerLogoAltInput.trim() || null,
        backgroundMediaUrl: backgroundMediaUrlInput.trim() || null,
        backgroundMediaType: backgroundMediaUrlInput.trim() ? backgroundMediaTypeInput : null,
        pageRedirectUrl: pageRedirectUrlInput.trim() || null,
        pageRedirectUntil: pageRedirectUntilInput ? new Date(pageRedirectUntilInput).getTime() : null
      };
      await api.studio.updateProfile(data);
      profileHook.setProfile(prev => ({ ...prev, ...data }));
      setPageSettingsFeedback(ui('Public page settings saved.'));
    } catch (error) {
      setPageSettingsFeedback(
        friendlyErrorMessage(error, ui('Could not save public page settings.'))
      );
    } finally {
      setIsSavingPageSettings(false);
    }
  };

  const value: BuilderContextType = {
    activeTab,
    setActiveTab,
    previewDevice,
    setPreviewDevice,
    qrModalOpen,
    setQrModalOpen,
    copiedLink,
    handleCopyPublicLink,

    ...profileHook,
    updateThemeOverride,

    ...autosaveHook,
    ...pagesHook,
    ...blocksHook,
    ...uploadsHook,
    ...socialLinksHook,
    ...analyticsHook,
    ...subscribersHook,
    ...instagramHook,
    ...apiKeysHook,
    ...formSubmissionsHook,

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
    isVerifyingDns,
    dnsVerificationResult,
    isSavingDomain,
    copiedCname,
    domainFeedback,
    handleVerifyDns,
    handleSaveCustomDomain,
    handleCopyCname,

    customCssInput,
    setCustomCssInput,
    customFontUrlInput,
    setCustomFontUrlInput,
    shareTitleInput,
    setShareTitleInput,
    shareDescriptionInput,
    setShareDescriptionInput,
    shareImageUrlInput,
    setShareImageUrlInput,
    footerLogoUrlInput,
    setFooterLogoUrlInput,
    footerLogoLinkInput,
    setFooterLogoLinkInput,
    footerLogoAltInput,
    setFooterLogoAltInput,
    backgroundMediaUrlInput,
    setBackgroundMediaUrlInput,
    backgroundMediaTypeInput,
    setBackgroundMediaTypeInput,
    pageRedirectUrlInput,
    setPageRedirectUrlInput,
    pageRedirectUntilInput,
    setPageRedirectUntilInput,
    isSavingPageSettings,
    pageSettingsFeedback,
    handleSavePageSettings,
    isSavingStyling,
    stylingSavedFeedback,
    stylingError,
    handleSaveCustomStyling,

    onViewFullscreen
  };

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
};
