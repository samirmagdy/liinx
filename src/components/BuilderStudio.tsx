import { useLanguage as useUiLanguage } from '../context/LanguageContext';
import React, { useState, useEffect, useRef } from 'react';
import { CreatorProfile, ThemeConfig, ProfileBlock, LinkBlock, FolderBlock, AudioBlock, VideoBlock, NewsletterBlock, SocialLink } from '../types';
import { DEMO_PROFILES, THEMES } from '../data/mockData';
import { PhonePreview } from './PhonePreview';
import { ViewportPreview } from './ViewportPreview';
import { QrCodeModal } from './QrCodeModal';
import { LinktreeImporterModal } from './LinktreeImporterModal';
import { api, authStorage } from '../services/api';
import { resolveTheme } from '../utils/colorContrast';
import { 
  Layers, 
  Palette, 
  Settings, 
  BarChart3, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  ExternalLink, 
  Share2, 
  Check, 
  QrCode, 
  Globe2, 
  CheckCircle2, 
  Eye, 
  Music, 
  Video, 
  FolderPlus, 
  Mail, 
  Clock, 
  Link as LinkIcon, 
  Sliders, 
  RotateCcw,
  Smartphone,
  Tablet,
  Monitor,
  Maximize2,
  Upload,
  Users,
  Loader2,
  TrendingUp,
  MousePointerClick,
  Download,
  ShieldCheck,
  Instagram,
  Twitter,
  Youtube,
  Github,
  Linkedin,
  Disc,
  RefreshCw,
  Sparkles,
  ChevronDown,
  Code,
  Key,
  Terminal,
  Copy,
  AlertCircle,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BookingEditor } from './BookingEditor';
import { SaveQueue } from '../utils/saveQueue';
import { useLanguage } from '../context/LanguageContext';
import { friendlyErrorMessage } from '../utils/errors';
import { Modal } from './Modal';

interface BuilderStudioProps {
  initialProfile?: CreatorProfile;
  onViewFullscreen: (profile: CreatorProfile, theme: ThemeConfig) => void;
}

type StructuredEditorKind = 'gallery' | 'carousel' | 'faq' | 'testimonials' | 'form';

function StructuredItemsEditor({ kind, value, onChange, onUpload, ui }: { kind: StructuredEditorKind; value: any[]; onChange: (value: any[]) => void; onUpload?: (file: File, index: number) => void; ui: (value: string) => string }) {
  const items = Array.isArray(value) ? value : [];
  const createItem = () => kind === 'form'
    ? { name: `field_${items.length + 1}`, label: 'New field', type: 'text', required: false }
    : kind === 'faq'
      ? { id: `item-${Date.now()}`, question: 'Question', answer: 'Answer' }
      : kind === 'testimonials'
        ? { id: `item-${Date.now()}`, quote: 'A great experience.', name: 'Client name' }
        : { id: `item-${Date.now()}`, imageUrl: '', alt: '', caption: '', title: '' };
  const update = (index: number, key: string, value: unknown) => onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  const remove = (index: number) => onChange(items.filter((_, itemIndex) => itemIndex !== index));
  const move = (index: number, direction: -1 | 1) => { const next = index + direction; if (next < 0 || next >= items.length) return; const copy = [...items]; [copy[index], copy[next]] = [copy[next], copy[index]]; onChange(copy); };
  return <div className="sm:col-span-2 space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
    <div className="flex items-center justify-between"><span className="text-[11px] font-bold text-neutral-700">{ui(kind === 'form' ? 'Form fields' : 'Items')}</span><button type="button" onClick={() => onChange([...items, createItem()])} className="rounded-lg border border-neutral-300 px-2 py-1 text-[11px] font-semibold hover:border-neutral-900">{ui('Add item')}</button></div>
    {items.length === 0 && <p className="py-3 text-[11px] text-neutral-500">{ui('No items yet. Add one to begin.')}</p>}
    {items.map((item, index) => <div key={item.id || item.name || index} className="grid grid-cols-1 gap-2 rounded-lg border border-neutral-200 bg-white p-2 sm:grid-cols-[1fr_auto]">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {kind === 'form' && <><input value={item.label || ''} onChange={e => update(index, 'label', e.target.value)} placeholder={ui('Label')} aria-label={ui('Field label')} className="rounded-lg border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-900" /><input value={item.name || ''} onChange={e => update(index, 'name', e.target.value.replace(/[^a-zA-Z0-9_-]/g, '_'))} placeholder={ui('Field name')} aria-label={ui('Field name')} className="rounded-lg border border-neutral-200 px-2 py-1.5 font-mono text-[11px] text-neutral-900" /><select value={item.type || 'text'} onChange={e => update(index, 'type', e.target.value)} aria-label={ui('Field type')} className="rounded-lg border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-900"><option value="text">{ui('Text')}</option><option value="email">{ui('Email')}</option><option value="tel">{ui('Phone')}</option><option value="textarea">{ui('Long text')}</option></select><label className="flex items-center gap-2 text-[11px] text-neutral-700"><input type="checkbox" checked={Boolean(item.required)} onChange={e => update(index, 'required', e.target.checked)} />{ui('Required')}</label></>}
        {kind === 'gallery' || kind === 'carousel' ? <><input value={item.imageUrl || ''} onChange={e => update(index, 'imageUrl', e.target.value)} placeholder={ui('Image URL')} aria-label={ui('Image URL')} className="rounded-lg border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-900 sm:col-span-2" /><input type="file" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (file && onUpload) onUpload(file, index); }} aria-label={ui('Upload image')} className="rounded-lg border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-900" /><input value={item.alt || ''} onChange={e => update(index, 'alt', e.target.value)} placeholder={ui('Alt text')} aria-label={ui('Alt text')} className="rounded-lg border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-900" /><input value={item.caption || ''} onChange={e => update(index, 'caption', e.target.value)} placeholder={ui('Caption')} aria-label={ui('Caption')} className="rounded-lg border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-900" /></> : null}
        {kind === 'faq' && <><input value={item.question || ''} onChange={e => update(index, 'question', e.target.value)} placeholder={ui('Question')} aria-label={ui('Question')} className="rounded-lg border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-900" /><textarea value={item.answer || ''} onChange={e => update(index, 'answer', e.target.value)} placeholder={ui('Answer')} aria-label={ui('Answer')} className="rounded-lg border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-900" /></>}
        {kind === 'testimonials' && <><textarea value={item.quote || ''} onChange={e => update(index, 'quote', e.target.value)} placeholder={ui('Quote')} aria-label={ui('Quote')} className="rounded-lg border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-900" /><input value={item.name || ''} onChange={e => update(index, 'name', e.target.value)} placeholder={ui('Name')} aria-label={ui('Name')} className="rounded-lg border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-900" /></>}
      </div>
      <div className="flex items-start justify-end gap-1"><button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={ui('Move item up')} className="rounded p-1 text-neutral-500 disabled:opacity-30">↑</button><button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label={ui('Move item down')} className="rounded p-1 text-neutral-500 disabled:opacity-30">↓</button><button type="button" onClick={() => remove(index)} aria-label={ui('Remove item')} className="rounded p-1 text-rose-600">×</button></div>
    </div>)}
  </div>;
}

export const BuilderStudio: React.FC<BuilderStudioProps> = ({
  initialProfile,
  onViewFullscreen
}) => {
  const { tr: ui } = useUiLanguage();
  const { tr } = useLanguage();
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>(initialProfile ? 'ready' : 'loading');
  const [profile, setProfile] = useState<CreatorProfile>(initialProfile || DEMO_PROFILES[0]);
  const [activeTab, setActiveTab] = useState<'content' | 'appearance' | 'settings' | 'analytics'>('content');
  const [customTheme, setCustomTheme] = useState<ThemeConfig>(() => resolveTheme(profile.themeId, profile.customTheme));
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [dataError, setDataError] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [activePageId, setActivePageId] = useState(profile.page?.id || profile.pages?.find(page => page.isHome)?.id || '');
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [pageEditTitle, setPageEditTitle] = useState('');
  const [pageEditSlug, setPageEditSlug] = useState('');
  const [pageEditDescription, setPageEditDescription] = useState('');
  const [pageEditPublished, setPageEditPublished] = useState(true);
  const [isSavingPage, setIsSavingPage] = useState(false);
  const [pageManagerError, setPageManagerError] = useState<string | null>(null);
  const [deletePageId, setDeletePageId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Social Links helper state
  const [newSocialPlatform, setNewSocialPlatform] = useState<SocialLink['platform']>('instagram');
  const [newSocialUrl, setNewSocialUrl] = useState('');

  // Live Analytics state
  const [analyticsData, setAnalyticsData] = useState<{
    totalViews: number;
    uniqueVisitors: number;
    totalClicks: number;
    ctr: string;
    topLinks: { id: string; title: string; url: string; clicks: number; percentage: number }[];
    dailyTimeline: { date: string; views: number; clicks: number }[];
    topReferrers: { referrer: string; count: number }[];
  } | null>(null);

  // Subscribers state
  const [subscribers, setSubscribers] = useState<{ id: string; email: string; subscribedAt: string }[]>([]);

  // Instagram Auto-Sync state
  const [instagramStatus, setInstagramStatus] = useState<{
    connected: boolean;
    configured: boolean;
    username?: string;
    autoSyncEnabled?: boolean;
    lastSyncedAt?: number;
    syncedLinksCount?: number;
  } | null>(null);
  const [isSyncingInstagram, setIsSyncingInstagram] = useState(false);
  const [instagramCaptionInput, setInstagramCaptionInput] = useState('');
  const [isTestingCaption, setIsTestingCaption] = useState(false);
  const [instagramFeedback, setInstagramFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showImporterModal, setShowImporterModal] = useState(false);

  // Multi-Profile Management
  const [profileList, setProfileList] = useState<{ id: string; username: string; displayName: string; avatarUrl: string; plan: string }[]>([]);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileSwitchError, setProfileSwitchError] = useState<string | null>(null);
  const [showNewProfileModal, setShowNewProfileModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [createProfileError, setCreateProfileError] = useState<string | null>(null);

  const pages = profile.pages || [];
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const initialPageId = (nextProfile: CreatorProfile) => nextProfile.pages?.find(page => page.isHome)?.id || nextProfile.pages?.[0]?.id || '';

  const loadProfilesList = () => {
    api.studio.getProfiles()
      .then(res => {
        if (res && Array.isArray(res.profiles)) {
          setProfileList(res.profiles);
        }
      })
      .catch(() => {});
  };

  const handleSelectProfile = async (targetId: string) => {
    if (queueRef.current?.dirty && !(await queueRef.current.flush())) return;
    if (targetId === profile.id) {
      setProfileDropdownOpen(false);
      return;
    }
    setProfileSwitchError(null);
    try {
      const res = await api.studio.selectProfile(targetId);
      if (res.token) {
        authStorage.setToken(res.token);
        const newLiveProfile = await api.studio.getProfile();
        setProfile(newLiveProfile);
        setActivePageId(initialPageId(newLiveProfile));
        setSaveStatus('saved');
        setSaveErrorBanner(null);
        const th = resolveTheme(newLiveProfile.themeId, newLiveProfile.customTheme);
        setCustomTheme(th);
        setGaInput(newLiveProfile.gaMeasurementId || '');
        setMetaPixelInput(newLiveProfile.metaPixelId || '');
        setProfileDropdownOpen(false);
        loadProfilesList();
      }
    } catch (err: any) {
      setProfileSwitchError(friendlyErrorMessage(err, ui('Failed to switch profile')));
    }
  };

  const handleCreateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (queueRef.current?.dirty && !(await queueRef.current.flush())) return;
    if (!newUsername.trim() || !newDisplayName.trim() || isCreatingProfile) return;
    setIsCreatingProfile(true);
    setCreateProfileError(null);

    try {
      const res = await api.studio.createProfile({
        username: newUsername.trim(),
        displayName: newDisplayName.trim()
      });
      if (res.token) {
        authStorage.setToken(res.token);
        const newLiveProfile = await api.studio.getProfile();
        setProfile(newLiveProfile);
        setActivePageId(initialPageId(newLiveProfile));
        setSaveStatus('saved');
        setSaveErrorBanner(null);
        const th = resolveTheme(newLiveProfile.themeId, newLiveProfile.customTheme);
        setCustomTheme(th);
        setShowNewProfileModal(false);
        setNewUsername('');
        setNewDisplayName('');
        loadProfilesList();
      }
    } catch (err: any) {
      setCreateProfileError(friendlyErrorMessage(err, 'We could not create the new bio profile. Check the details and try again.'));
    } finally {
      setIsCreatingProfile(false);
    }
  };

  // Tracking Pixels (GA4 & Meta Pixel)
  const [gaInput, setGaInput] = useState(profile.gaMeasurementId || '');
  const [metaPixelInput, setMetaPixelInput] = useState(profile.metaPixelId || '');
  const [isSavingPixels, setIsSavingPixels] = useState(false);
  const [pixelsSavedFeedback, setPixelsSavedFeedback] = useState(false);
  const [pixelsError, setPixelsError] = useState<string | null>(null);

  // Custom Domain State (Milestone 6)
  const [customDomainInput, setCustomDomainInput] = useState(profile.customDomain || '');
  const [isVerifyingDns, setIsVerifyingDns] = useState(false);
  const [dnsVerificationResult, setDnsVerificationResult] = useState<{ verified: boolean; message: string } | null>(null);
  const [isSavingDomain, setIsSavingDomain] = useState(false);
  const [copiedCname, setCopiedCname] = useState(false);
  const [domainFeedback, setDomainFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Custom CSS & Font Engine State (Milestone 7)
  const [customCssInput, setCustomCssInput] = useState(profile.customCss || '');
  const [customFontUrlInput, setCustomFontUrlInput] = useState(profile.customFontUrl || '');
  const [shareTitleInput, setShareTitleInput] = useState(profile.shareTitle || '');
  const [shareDescriptionInput, setShareDescriptionInput] = useState(profile.shareDescription || '');
  const [shareImageUrlInput, setShareImageUrlInput] = useState(profile.shareImageUrl || '');
  const [footerLogoUrlInput, setFooterLogoUrlInput] = useState(profile.footerLogoUrl || '');
  const [backgroundMediaUrlInput, setBackgroundMediaUrlInput] = useState(profile.backgroundMediaUrl || '');
  const [backgroundMediaTypeInput, setBackgroundMediaTypeInput] = useState<'image' | 'video'>((profile.backgroundMediaType as 'image' | 'video') || 'image');
  const [pageRedirectUrlInput, setPageRedirectUrlInput] = useState(profile.pageRedirectUrl || '');
  const [pageRedirectUntilInput, setPageRedirectUntilInput] = useState(profile.pageRedirectUntil ? new Date(profile.pageRedirectUntil).toISOString().slice(0, 16) : '');
  const [isSavingPageSettings, setIsSavingPageSettings] = useState(false);
  const [pageSettingsFeedback, setPageSettingsFeedback] = useState<string | null>(null);
  const [formSubmissions, setFormSubmissions] = useState<{ id: string; blockId: string; fields: Record<string, string>; createdAt: number }[]>([]);
  const [showAllFormSubmissions, setShowAllFormSubmissions] = useState(false);
  const [isSavingStyling, setIsSavingStyling] = useState(false);
  const [stylingSavedFeedback, setStylingSavedFeedback] = useState(false);
  const [stylingError, setStylingError] = useState<string | null>(null);

  // REST API Keys State (Milestone 8)
  const [apiKeyList, setApiKeyList] = useState<{ id: string; prefix: string; name: string; createdAt: number }[]>([]);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [generateKeyError, setGenerateKeyError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [confirmRevokeKeyId, setConfirmRevokeKeyId] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  useEffect(() => {
    setShareTitleInput(profile.shareTitle || '');
    setShareDescriptionInput(profile.shareDescription || '');
    setShareImageUrlInput(profile.shareImageUrl || '');
    setFooterLogoUrlInput(profile.footerLogoUrl || '');
    setBackgroundMediaUrlInput(profile.backgroundMediaUrl || '');
    setBackgroundMediaTypeInput(profile.backgroundMediaType || 'image');
    setPageRedirectUrlInput(profile.pageRedirectUrl || '');
    setPageRedirectUntilInput(profile.pageRedirectUntil ? new Date(profile.pageRedirectUntil).toISOString().slice(0, 16) : '');
  }, [profile.id]);

  // Non-blocking UI Inline Feedback States
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [confirmDeleteBlockId, setConfirmDeleteBlockId] = useState<string | null>(null);

  const loadApiKeys = () => {
    api.studio.getApiKeys()
      .then(res => {
        if (res && Array.isArray(res.keys)) {
          setApiKeyList(res.keys);
        }
      })
      .catch(() => {});
  };

  const handleGenerateApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || isGeneratingKey) return;
    setIsGeneratingKey(true);
    setGenerateKeyError(null);
    try {
      const res = await api.studio.createApiKey(newKeyName.trim());
      setCreatedApiKey(res.apiKey);
      loadApiKeys();
    } catch (err: any) {
      setGenerateKeyError(friendlyErrorMessage(err, 'We could not generate the API key. Please try again.'));
    } finally {
      setIsGeneratingKey(false);
    }
  };

  // Load live profile on initial mount
  useEffect(() => {
    api.studio.getProfile()
      .then(async liveProfile => {
        if (!liveProfile || !liveProfile.id) throw new Error('Invalid profile response');
        const params = new URLSearchParams(window.location.search);
        const template = params.get('template');
        const shouldOpenImporter = params.get('import') === '1';
        if (template && THEMES.some(theme => theme.id === template)) {
          await api.studio.updateProfile({ themeId: template, customTheme: THEMES.find(theme => theme.id === template)! });
          liveProfile = await api.studio.getProfile();
          window.history.replaceState(null, '', '/studio');
        }
        setLoadState('ready');
        setProfile(liveProfile);
        setActivePageId(initialPageId(liveProfile));
        setGaInput(liveProfile.gaMeasurementId || '');
        setMetaPixelInput(liveProfile.metaPixelId || '');
        setCustomDomainInput(liveProfile.customDomain || '');
        setCustomCssInput(liveProfile.customCss || '');
        setCustomFontUrlInput(liveProfile.customFontUrl || '');
        const th = resolveTheme(liveProfile.themeId, liveProfile.customTheme);
        setCustomTheme(th);
        if (shouldOpenImporter) {
          setShowImporterModal(true);
          window.history.replaceState(null, '', '/studio');
        }
      })
      .catch(err => {
        setLoadState('error');
      });

    loadProfilesList();
  }, []);

  useEffect(() => {
    const page = pages.find(item => item.id === activePageId);
    if (!page) return;
    setPageEditTitle(page.title);
    setPageEditSlug(page.slug);
    setPageEditDescription(page.description || '');
    setPageEditPublished(page.published);
  }, [activePageId, pages]);

  // Fetch real analytics or subscribers/instagram/api-keys when tabs change
  useEffect(() => {
    setDataError(false);
    if (activeTab === 'analytics') {
      api.studio.getAnalytics()
        .then(data => {
          if (data) setAnalyticsData(data);
        })
        .catch(() => setDataError(true));
    } else if (activeTab === 'settings') {
      api.studio.getSubscribers()
        .then(res => {
          if (res && Array.isArray(res.subscribers)) setSubscribers(res.subscribers);
        })
        .catch(() => setDataError(true));
      api.studio.getFormSubmissions()
        .then(res => setFormSubmissions(res.submissions || []))
        .catch(() => setDataError(true));

      api.instagram.getStatus()
        .then(status => {
          if (status) setInstagramStatus(status);
        })
        .catch(() => setDataError(true));

      if (profile.plan === 'studio') {
        loadApiKeys();
      }
    }
  }, [activeTab, profile.plan]);

  const handleConnectInstagram = async () => {
    try {
      setInstagramFeedback(null);
      const res = await api.instagram.getAuthUrl();
      if (res.authUrl) {
        window.location.href = res.authUrl;
      }
    } catch (err: any) {
      setInstagramFeedback({
        type: 'error',
        message: friendlyErrorMessage(err, 'Instagram connection is not available right now. Please try again later.')
      });
    }
  };

  const handleSyncInstagramNow = async () => {
    try {
      setIsSyncingInstagram(true);
      setInstagramFeedback(null);
      const res = await api.instagram.syncNow();
      setInstagramFeedback({
        type: 'success',
        message: res.message || `Sync complete. Created ${res.linksCreated.length} links.`
      });
      const refreshed = await api.studio.getProfile();
      setProfile(refreshed);
      if (!refreshed.pages?.some(item => item.id === activePageId)) setActivePageId(initialPageId(refreshed));
      const status = await api.instagram.getStatus();
      setInstagramStatus(status);
    } catch (err: any) {
      setInstagramFeedback({
        type: 'error',
        message: friendlyErrorMessage(err, 'Instagram could not be synced. Check the connection and try again.')
      });
    } finally {
      setIsSyncingInstagram(false);
    }
  };

  const handleToggleInstagramAutoSync = async () => {
    if (!instagramStatus) return;
    const nextVal = !instagramStatus.autoSyncEnabled;
    try {
      await api.instagram.toggleAutoSync(nextVal);
      setInstagramStatus(prev => prev ? { ...prev, autoSyncEnabled: nextVal } : null);
    } catch (err: any) {
      setInstagramFeedback({
        type: 'error',
        message: friendlyErrorMessage(err, 'We could not update auto-sync. Please try again.')
      });
    }
  };

  const handleDisconnectInstagram = async () => {
    try {
      await api.instagram.disconnect();
      setInstagramStatus({
        connected: false,
        configured: Boolean(instagramStatus?.configured)
      });
      setInstagramFeedback({
        type: 'success',
        message: 'Instagram account disconnected successfully.'
      });
    } catch (err: any) {
      setInstagramFeedback({
        type: 'error',
        message: friendlyErrorMessage(err, 'We could not disconnect Instagram. Please try again.')
      });
    }
  };

  const handleTestCaptionExtract = async (saveToProfile: boolean) => {
    if (!instagramCaptionInput.trim()) return;
    try {
      setIsTestingCaption(true);
      setInstagramFeedback(null);
      const res = await api.instagram.testCaption(instagramCaptionInput, saveToProfile);
      if (res.extracted.length === 0) {
        setInstagramFeedback({
          type: 'error',
          message: 'No valid web URLs detected in this caption.'
        });
      } else if (saveToProfile) {
        setInstagramFeedback({
          type: 'success',
          message: `Extracted & added ${res.savedCount} new link(s) to your bio!`
        });
        const refreshed = await api.studio.getProfile();
        setProfile(refreshed);
        setInstagramCaptionInput('');
      } else {
        setInstagramFeedback({
          type: 'success',
          message: `Detected ${res.extracted.length} link(s): "${res.extracted.map(l => l.title).join('", "')}"`
        });
      }
    } catch (err: any) {
      setInstagramFeedback({
        type: 'error',
        message: friendlyErrorMessage(err, 'We could not read that caption. Check the text and try again.')
      });
    } finally {
      setIsTestingCaption(false);
    }
  };

  const [saveErrorBanner, setSaveErrorBanner] = useState<string | null>(null);
  const queueRef = useRef<SaveQueue | null>(null);
  if (!queueRef.current) queueRef.current = new SaveQueue(
    async (key, patch) => {
      if (key === 'profile') {
        const result = await api.studio.updateProfile(patch);
        if (result.revision !== undefined) {
          profileRef.current = { ...profileRef.current, revision: result.revision };
          setProfile(previous => ({ ...previous, revision: result.revision }));
        }
        return result;
      }
      const result = await api.studio.updateBlock(key, patch);
      if (result.revision !== undefined) {
        profileRef.current = { ...profileRef.current, blocks: profileRef.current.blocks.map(block => block.id === key ? { ...block, revision: result.revision } : block) };
        setProfile(previous => ({ ...previous, blocks: previous.blocks.map(block => block.id === key ? { ...block, revision: result.revision } : block) }));
      }
      return result;
    },
    state => {
      setSaveStatus(state);
      setSaveErrorBanner(state === 'error' ? 'Changes are not saved. Check your connection and retry.' : null);
    }
  );
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (queueRef.current?.dirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', warn);
    const navigate = async (event: MouseEvent) => {
      const anchor = (event.target as Element)?.closest('a');
      if (!anchor || anchor.target === '_blank' || !queueRef.current?.dirty) return;
      event.preventDefault(); event.stopPropagation();
      if (await queueRef.current.flush()) window.location.assign(anchor.href);
    };
    document.addEventListener('click', navigate, true);
    return () => { window.removeEventListener('beforeunload', warn); document.removeEventListener('click', navigate, true); queueRef.current?.dispose(); };
  }, []);
  const triggerAutoSave = (updated: Partial<CreatorProfile>) => {
    const allowedKeys = new Set([
      'displayName', 'bio', 'avatarUrl', 'category', 'themeId',
      'hideBranding', 'gaMeasurementId', 'metaPixelId', 'customDomain',
      'customCss', 'customFontUrl', 'customTheme', 'socials'
    ]);
    const patch = Object.fromEntries(
      Object.entries(updated).filter(([k, v]) => allowedKeys.has(k) && v !== undefined)
    );
    if (Object.keys(patch).length > 0) {
      queueRef.current!.enqueue('profile', { ...patch, revision: profileRef.current.revision });
    }
  };
  const handleRetryFailedSaves = () => queueRef.current!.flush();

  const handleProfileChange = (field: keyof CreatorProfile, value: any) => {
    const updated = { ...profile, [field]: value };
    setProfile(updated);
    triggerAutoSave({ [field]: value });
  };

  // Avatar Image Upload
  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setAvatarError(null);
    try {
      const res = await api.studio.uploadImage(file);
      const updated = { ...profile, avatarUrl: res.url };
      setProfile(updated);
      triggerAutoSave({ avatarUrl: res.url });
    } catch (err: any) {
      setAvatarError(friendlyErrorMessage(err, ui('Image upload failed')));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleBlockImageUpload = async (blockId: string, file: File, field = 'imageUrl', itemIndex?: number) => {
    try {
      setSaveStatus('saving');
      const uploaded = await api.studio.uploadImage(file);
      if (queueRef.current?.dirty && !(await queueRef.current.flush())) throw new Error(ui('Changes are not saved. Check your connection and retry.'));
      const block = profileRef.current.blocks.find(candidate => candidate.id === blockId) as any;
      const current = block?.items || [];
      const nextItems = itemIndex === undefined ? current : current.map((item: any, index: number) => index === itemIndex ? { ...item, [field]: uploaded.url } : item);
      queueBlockUpdate(blockId, itemIndex === undefined ? { extra: { [field]: uploaded.url } } : { extra: { items: nextItems } });
      if (!(await queueRef.current!.flush())) throw new Error(ui('Changes are not saved. Check your connection and retry.'));
      setProfile(previous => ({ ...previous, blocks: previous.blocks.map(candidate => candidate.id === blockId ? { ...candidate, ...(itemIndex === undefined ? { [field]: uploaded.url } : { items: nextItems }) } as any : candidate) }));
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('error');
      setSaveErrorBanner(friendlyErrorMessage(error, ui('Image upload failed')));
    }
  };

  const handleBlockFileUpload = async (blockId: string, file: File) => {
    try {
      setSaveStatus('saving');
      const uploaded = await api.studio.uploadFile(file);
      if (queueRef.current?.dirty && !(await queueRef.current.flush())) throw new Error(ui('Changes are not saved. Check your connection and retry.'));
      queueBlockUpdate(blockId, { extra: { fileUrl: uploaded.url, downloadName: uploaded.originalName } });
      if (!(await queueRef.current!.flush())) throw new Error(ui('Changes are not saved. Check your connection and retry.'));
      setProfile(previous => ({ ...previous, blocks: previous.blocks.map(candidate => candidate.id === blockId ? { ...candidate, fileUrl: uploaded.url, downloadName: uploaded.originalName } as any : candidate) }));
      setSaveStatus('saved');
    } catch (error) { setSaveStatus('error'); setSaveErrorBanner(friendlyErrorMessage(error, ui('File upload failed'))); }
  };

  // Social Links Operations
  const handleAddSocial = () => {
    if (!newSocialUrl.trim()) return;
    let cleanUrl = newSocialUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('mailto:')) {
      cleanUrl = `https://${cleanUrl}`;
    }
    const currentSocials = profile.socials || [];
    const updatedSocials = [...currentSocials, { platform: newSocialPlatform, url: cleanUrl }];
    const updated = { ...profile, socials: updatedSocials };
    setProfile(updated);
    triggerAutoSave({ socials: updatedSocials });
    setNewSocialUrl('');
  };

  const handleRemoveSocial = (index: number) => {
    const currentSocials = profile.socials || [];
    const updatedSocials = currentSocials.filter((_, i) => i !== index);
    const updated = { ...profile, socials: updatedSocials };
    setProfile(updated);
    triggerAutoSave({ socials: updatedSocials });
  };

  // Plan Upgrade Operation
  const handleUpgradePlan = async (targetPlan: 'free' | 'pro' | 'studio') => {
    setBillingError(null);
    try {
      setSaveStatus('saving');
      if (queueRef.current?.dirty && !(await queueRef.current.flush())) return;
      const res = targetPlan === 'free' || profile.plan !== 'free'
        ? await api.billing.createPortalSession()
        : await api.billing.createCheckoutSession(targetPlan);
      window.location.assign(res.url);
    } catch (err: any) {
      setBillingError(friendlyErrorMessage(err, ui('Failed to update plan')));
      setSaveStatus('error');
    }
  };

  const createBlockForPage = (data: { type: string; title: string; [key: string]: any }) =>
    api.studio.createBlock({ ...data, pageId: activePageId || undefined });

  const activePage = pages.find(page => page.id === activePageId) || pages.find(page => page.isHome);
  const visibleBlocks = activePage ? profile.blocks.filter(block => !(block as any).pageId || (block as any).pageId === activePage.id) : profile.blocks;

  const handleCreatePage = async () => {
    const title = newPageTitle.trim();
    const slug = newPageSlug.trim().toLowerCase();
    if (!title || !slug) return setPageManagerError(ui('Enter a page title and URL slug.'));
    try {
      const result = await api.studio.createPage({ title, slug });
      setProfile(previous => ({ ...previous, pages: [...(previous.pages || []), result.page] }));
      setActivePageId(result.page.id);
      setNewPageTitle('');
      setNewPageSlug('');
      setPageManagerError(null);
    } catch (error: any) {
      setPageManagerError(friendlyErrorMessage(error, ui('Could not create this page.')));
    }
  };

  const handleDeletePage = async (pageId: string) => {
    const page = pages.find(item => item.id === pageId);
    if (!page || page.isHome) return;
    try {
      if (queueRef.current?.dirty && !(await queueRef.current.flush())) {
        setPageManagerError(ui('Changes are not saved. Retry before deleting this page.'));
        return;
      }
      await api.studio.deletePage(pageId);
      const nextPages = pages.filter(item => item.id !== pageId);
      if (activePageId === pageId) setActivePageId(nextPages.find(item => item.isHome)?.id || nextPages[0]?.id || '');
      const refreshed = await api.studio.getProfile();
      setProfile(refreshed);
      setDeletePageId(null);
      setPageManagerError(null);
    } catch (error: any) {
      setPageManagerError(friendlyErrorMessage(error, ui('Could not delete this page.')));
    }
  };

  const handleSavePage = async () => {
    if (!activePage || isSavingPage) return;
    const title = pageEditTitle.trim();
    const slug = pageEditSlug.trim().toLowerCase();
    if (!title || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setPageManagerError(ui('Use a title and a lowercase URL slug with hyphens only.'));
      return;
    }
    setIsSavingPage(true);
    try {
      const result = await api.studio.updatePage(activePage.id, { title, slug, description: pageEditDescription.trim() || null, published: activePage.isHome ? true : pageEditPublished, revision: activePage.revision });
      const updated = { ...activePage, title, slug, description: pageEditDescription.trim() || null, published: activePage.isHome ? true : pageEditPublished, revision: result.revision ?? activePage.revision };
      setProfile(previous => ({ ...previous, pages: (previous.pages || []).map(page => page.id === activePage.id ? updated : page) }));
      setPageManagerError(null);
    } catch (error: any) {
      setPageManagerError(friendlyErrorMessage(error, ui('Could not save page settings.')));
    } finally {
      setIsSavingPage(false);
    }
  };

  const handleMovePage = async (direction: -1 | 1) => {
    const index = pages.findIndex(page => page.id === activePage?.id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= pages.length) return;
    const reordered = [...pages];
    [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
    try {
      const result = await api.studio.reorderPages(reordered.map(page => page.id));
      setProfile(previous => ({ ...previous, pages: result.pages || reordered.map((page, sortOrder) => ({ ...page, sortOrder })) }));
    } catch (error: any) {
      setPageManagerError(friendlyErrorMessage(error, ui('Could not reorder pages.')));
    }
  };

  // Block Operations with Real Database Calls
  const handleAddLink = async () => {
    try {
      setSaveStatus('saving');
      const newBlock = await createBlockForPage({
        type: 'link',
        title: 'New Featured Link',
        url: 'https://',
        subtitle: 'Tap to visit destination',
        badge: 'NEW',
        highlighted: false
      });
      setProfile(prev => ({ ...prev, blocks: [newBlock, ...prev.blocks] }));
      setShowAddMenu(false);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to add link block:', err);
      setSaveStatus('error');
    }
  };

  const handleAddHeader = async () => {
    try {
      setSaveStatus('saving');
      const newBlock = await createBlockForPage({
        type: 'header',
        title: 'New Section Header'
      });
      setProfile(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
      setShowAddMenu(false);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to add header block:', err);
      setSaveStatus('error');
    }
  };

  const handleAddAudio = async () => {
    try {
      setSaveStatus('saving');
      const newBlock = await createBlockForPage({
        type: 'audio',
        title: 'New Single Track',
        url: 'https://spotify.com',
        extra: {
          artist: profile.displayName,
          coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop',
          audioUrl: 'https://spotify.com',
          platform: 'spotify'
        }
      });
      setProfile(prev => ({ ...prev, blocks: [newBlock, ...prev.blocks] }));
      setShowAddMenu(false);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to add audio block:', err);
      setSaveStatus('error');
    }
  };

  const handleAddVideo = async () => {
    try {
      setSaveStatus('saving');
      const newBlock = await createBlockForPage({
        type: 'video',
        title: 'Behind The Scenes Film',
        url: 'https://youtube.com',
        extra: {
          videoUrl: 'https://youtube.com',
          thumbnailUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop',
          platform: 'youtube'
        }
      });
      setProfile(prev => ({ ...prev, blocks: [newBlock, ...prev.blocks] }));
      setShowAddMenu(false);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to add video block:', err);
      setSaveStatus('error');
    }
  };

  const handleAddFolder = async () => {
    try {
      setSaveStatus('saving');
      const newBlock = await createBlockForPage({
        type: 'folder',
        title: 'Curated Resource Links',
        extra: {
          subtitle: 'Expandable collection of destinations',
          items: [
            { id: 'f_1', title: 'Main Project', url: 'https://github.com' },
            { id: 'f_2', title: 'Documentation', url: 'https://liinx.app/features' }
          ]
        }
      });
      setProfile(prev => ({ ...prev, blocks: [newBlock, ...prev.blocks] }));
      setShowAddMenu(false);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to add folder block:', err);
      setSaveStatus('error');
    }
  };

  const handleAddNewsletter = async () => {
    try {
      setSaveStatus('saving');
      const newBlock = await createBlockForPage({
        type: 'newsletter',
        title: 'Weekly Creator Dispatch',
        extra: {
          description: 'Get weekly essays, behind-the-scenes thoughts, and exclusive releases.',
          buttonText: 'Join Newsletter'
        }
      });
      setProfile(prev => ({ ...prev, blocks: [newBlock, ...prev.blocks] }));
      setShowAddMenu(false);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to add newsletter block:', err);
      setSaveStatus('error');
    }
  };

  const handleAddAdvancedBlock = async (type: string) => {
    const defaults: Record<string, { title: string; subtitle?: string; extra?: Record<string, unknown> }> = {
      rich_text: { title: 'About this work', extra: { body: 'Add your story, services, or introduction here.' } },
      image: { title: 'Featured image', extra: { imageUrl: '', alt: '', caption: '' } },
      gallery: { title: 'Gallery', extra: { items: [{ id: 'item-1', imageUrl: '', alt: '' }] } },
      carousel: { title: 'Highlights', extra: { items: [{ id: 'item-1', imageUrl: '', alt: '' }] } },
      spacer: { title: 'Spacer', extra: { height: 48 } },
      form: { title: 'Get in touch', subtitle: 'Send me a message.', extra: { fields: [{ name: 'name', label: 'Name', type: 'text', required: true }, { name: 'email', label: 'Email', type: 'email', required: true }, { name: 'message', label: 'Message', type: 'textarea', required: true }] } },
      download: { title: 'Download', extra: { fileUrl: '', description: 'Download this file.' } },
      map: { title: 'Find me', extra: { location: '' } },
      faq: { title: 'Frequently asked questions', extra: { items: [{ id: 'item-1', question: 'Question', answer: 'Answer' }] } },
      testimonials: { title: 'What clients say', extra: { items: [{ id: 'item-1', quote: 'A great experience.', name: 'Client name' }] } },
      event: { title: 'Upcoming event', subtitle: 'Add event details.', extra: { date: '', url: '' } },
      presave: { title: 'Pre-save my release', extra: { url: '', description: 'Save the next release.' } },
      phone: { title: 'Call me', extra: { phone: '', description: 'Available for inquiries.' } },
      product: { title: 'Featured product', extra: { price: '', url: '', description: '' } },
      tips: { title: 'Support my work', extra: { url: '', description: 'Send a tip.' } },
      content_gate: { title: 'Members-only content', extra: { password: '', description: 'Enter the access code.', body: 'Add the protected content here.' } }
    };
    const preset = defaults[type] || defaults.rich_text;
    try {
      const newBlock = await createBlockForPage({ type: type as any, title: preset.title, subtitle: preset.subtitle, extra: preset.extra });
      setProfile(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
      setShowAddMenu(false);
    } catch (error) { setDataError(true); }
  };

  const handleMoveBlock = async (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...visibleBlocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;

    try {
      setSaveStatus('saving');
      await api.studio.reorderBlocks(newBlocks.map(b => b.id), activePage?.id);
      setProfile(prev => {
        let reorderedIndex = 0;
        const visibleIds = new Set(visibleBlocks.map(block => block.id));
        return {
          ...prev,
          blocks: prev.blocks.map(block => visibleIds.has(block.id) ? newBlocks[reorderedIndex++] : block)
        };
      });
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const handleMoveBlockToPage = async (blockId: string, pageId: string) => {
    if (!pageId || queueRef.current?.dirty && !(await queueRef.current.flush())) return;
    try {
      setSaveStatus('saving');
      await api.studio.moveBlock(blockId, pageId);
      const refreshed = await api.studio.getProfile();
      setProfile(refreshed);
      setSaveStatus('saved');
    } catch { setSaveStatus('error'); }
  };

  const handleDuplicateBlock = async (blockId: string) => {
    if (!activePage || queueRef.current?.dirty && !(await queueRef.current.flush())) return;
    try {
      setSaveStatus('saving');
      const result = await api.studio.duplicateBlock(blockId, activePage.id);
      setProfile(previous => ({ ...previous, blocks: [...previous.blocks, result.block] }));
      setSaveStatus('saved');
    } catch { setSaveStatus('error'); }
  };

  const handleDeleteBlock = async (id: string) => {
    if (queueRef.current?.dirty && !(await queueRef.current.flush())) return;
    try {
      setSaveStatus('saving');
      await api.studio.deleteBlock(id);
      setProfile(prev => ({ ...prev, blocks: prev.blocks.filter(b => b.id !== id) }));
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const queueBlockUpdate = (id: string, fields: Record<string, any>) => {
    const revision = profileRef.current.blocks.find(block => block.id === id)?.revision;
    queueRef.current!.enqueue(id, { ...fields, revision });
  };

  const handleUpdateBlockField = (id: string, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === id ? { ...b, [field]: value } : b)
    }));
    queueBlockUpdate(id, { [field]: value });
  };

  const handleUpdateBlockExtra = (id: string, extraUpdates: Record<string, any>) => {
    setProfile(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === id ? { ...b, ...extraUpdates } : b)
    }));
    queueBlockUpdate(id, { extra: extraUpdates });
  };

  // Folder Block item helpers
  const handleAddFolderItem = (blockId: string) => {
    const block = profile.blocks.find(b => b.id === blockId) as FolderBlock;
    if (!block) return;
    const currentItems = block.items || [];
    const newItems = [...currentItems, { id: 'fi_' + Date.now(), title: 'New Link', url: 'https://' }];
    handleUpdateBlockExtra(blockId, { items: newItems });
  };

  const handleRemoveFolderItem = (blockId: string, itemId: string) => {
    const block = profile.blocks.find(b => b.id === blockId) as FolderBlock;
    if (!block) return;
    const newItems = (block.items || []).filter(item => item.id !== itemId);
    handleUpdateBlockExtra(blockId, { items: newItems });
  };

  const handleUpdateFolderItem = (blockId: string, itemId: string, field: 'title' | 'url', val: string) => {
    const block = profile.blocks.find(b => b.id === blockId) as FolderBlock;
    if (!block) return;
    const newItems = (block.items || []).map(item => item.id === itemId ? { ...item, [field]: val } : item);
    handleUpdateBlockExtra(blockId, { items: newItems });
  };

  const handleCopyPublicLink = async () => {
    try { await navigator.clipboard.writeText(`${window.location.origin}/@${profile.username}`); }
    catch { setSaveErrorBanner(ui('Could not copy link. Copy the address from the live page.')); return; }
    setCopiedLink(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.3 }
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const toDateTimeLocal = (ts?: number | null) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  const fromDateTimeLocal = (val: string): number | null => {
    if (!val) return null;
    const parsed = new Date(val).getTime();
    return isNaN(parsed) ? null : parsed;
  };

  const getScheduleStatus = (startAt?: number | null, endAt?: number | null) => {
    if (!startAt && !endAt) return null;
    const now = Date.now();
    if (startAt && now < startAt) {
      return { label: `SCHEDULED (${new Date(startAt).toLocaleDateString()})`, color: 'bg-amber-100 text-amber-800' };
    }
    if (endAt && now > endAt) {
      return { label: 'EXPIRED', color: 'bg-neutral-100 text-neutral-600' };
    }
    return { label: 'LIVE SCHEDULED', color: 'bg-emerald-100 text-emerald-800' };
  };

  const handleThemeSelect = (theme: ThemeConfig) => {
    setCustomTheme(theme);
    const updated = { ...profile, themeId: theme.id, customTheme: theme };
    setProfile(updated);
    triggerAutoSave(updated);
  };

  // Export CSV
  const handleExportCsv = () => {
    if (subscribers.length === 0) return;
    const headers = 'Email,Subscribed At\n';
    const rows = subscribers.map(s => `"${s.email}","${s.subscribedAt}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `liinx-${profile.username}-subscribers.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleDeleteSubscriber = async (id: string) => {
    if (!window.confirm(ui('Remove this subscriber from your list?'))) return;
    try {
      await api.studio.deleteSubscriber(id);
      setSubscribers(current => current.filter(subscriber => subscriber.id !== id));
    } catch (err: any) {
      setDataError(true);
    }
  };

  if (loadState !== 'ready') {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-neutral-50 flex flex-col items-center justify-center p-6 text-center" role="status">
        {loadState === 'loading' ? (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400 mb-4" />
            <p className="text-sm font-mono text-neutral-500">{tr('Loading your profile…')}</p>
          </>
        ) : (
          <div className="max-w-md bg-neutral-50 p-8 rounded-3xl border border-neutral-200 shadow-sm flex flex-col items-center animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-4 text-rose-600">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900 mb-2">
              {tr('Could not load your profile')}
            </h2>
            <p className="text-xs text-neutral-500 mb-6 max-w-sm text-pretty">
              {tr('Could not load your profile. No demo data is being shown.')}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
            >
              {tr('Retry')}
            </button>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="studio-shell min-h-[calc(100vh-72px)] bg-neutral-50 border-t border-neutral-200 flex flex-col">
      
      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Studio Top Control Bar */}
      <div className="studio-toolbar bg-neutral-100 border-b border-neutral-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-18 z-30 shadow-2xs">
        
        {/* Left: Username & Save Status */}
        <div className="flex items-center gap-4">
          {/* Multi-Profile Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileSwitchError(null);
                setProfileDropdownOpen(!profileDropdownOpen);
              }}
              className="flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer text-xs font-bold text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
            >
              <span className="font-mono">@{profile.username}</span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                {profile.plan || 'free'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-neutral-100 rounded-2xl shadow-xl border border-neutral-200 py-2 z-50 animate-fade-in">
                {profileSwitchError && (
                  <div role="alert" className="mx-2 mb-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700 font-medium">
                    {profileSwitchError}
                  </div>
                )}
                <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">
                  {ui("Switch Profile (")}{profileList.length})
                </div>
                <div className="max-h-56 overflow-y-auto divide-y divide-neutral-50">
                  {profileList.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectProfile(p.id)}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs hover:bg-neutral-50 transition-colors cursor-pointer ${
                        p.id === profile.id ? 'bg-neutral-50 font-bold text-neutral-900' : 'text-neutral-700'
                      }`}
                    >
                      <div className="flex flex-col truncate">
                        <span className="truncate">{p.displayName || p.username}</span>
                        <span className="text-[10px] font-mono text-neutral-400">@{p.username}</span>
                      </div>
                      {p.id === profile.id && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="pt-2 mt-1 border-t border-neutral-100 px-2">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setShowNewProfileModal(true);
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{ui("New Bio Profile")}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="save-status flex items-center gap-1.5 text-xs text-neutral-500">
            <span className={`w-2 h-2 rounded-full ${
              saveStatus === 'saving' ? 'bg-amber-500 animate-ping' : 
              saveStatus === 'error' ? 'bg-rose-500' : 'bg-emerald-500'
            }`} />
            <span className="font-mono text-[11px]">
              {ui(saveErrorBanner ? 'Save failed' : queueRef.current?.dirty || saveStatus === 'saving' ? 'Saving...' : saveStatus === 'error' ? 'Save failed' : 'Saved')}
            </span>
            {queueRef.current?.dirty && saveStatus === 'error' && (
              <button
                type="button"
                onClick={handleRetryFailedSaves}
                className="ml-1 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-[10px] font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                {ui("Retry")}</button>
            )}
          </div>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQrModalOpen(true)}
            aria-label={ui('QR Code')}
            className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:border-neutral-900 bg-neutral-50 text-xs font-semibold text-neutral-900 flex items-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{ui("QR Code")}</span>
          </button>

          <button
            onClick={handleCopyPublicLink}
            aria-label={ui('Copy Link')}
            className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:border-neutral-900 bg-neutral-50 text-xs font-semibold text-neutral-900 flex items-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{ui("Copied!")}</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{ui("Copy Link")}</span>
              </>
            )}
          </button>

          <button
            onClick={async () => { if (!queueRef.current?.dirty || await queueRef.current.flush()) onViewFullscreen(profile, customTheme); }}
            className="px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95 shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
          >
            <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
            <span>{ui("View Live Page")}</span>
          </button>
        </div>

      </div>

      {/* Main Studio Workspace: Left Editor + Right Simulator */}
      {saveErrorBanner && <p role="alert" className="p-4 text-red-700">{ui(saveErrorBanner)}</p>}
      {dataError && <p role="alert" className="p-4 text-red-700">{ui('Could not load data. Reopen this tab to retry.')}</p>}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Control Canvas (7 cols) */}
        <div className="studio-controls lg:col-span-7 space-y-6">
          
          {/* Navigation Sub-Tabs */}
          <div className="studio-tabs flex items-center p-1 bg-neutral-50 border border-neutral-200 rounded-2xl shadow-xs gap-1">
            <button
              onClick={() => setActiveTab('content')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${
                activeTab === 'content'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{ui("Blocks & Content")}</span>
            </button>

            <button
              onClick={() => setActiveTab('appearance')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${
                activeTab === 'appearance'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>{ui("Themes & Styles")}</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${
                activeTab === 'analytics'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{ui("Analytics")}</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${
                activeTab === 'settings'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{ui("Settings & Plan")}</span>
            </button>
          </div>

          {/* TAB 1: CONTENT & PROFILE BLOCKS */}
          {activeTab === 'content' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Profile Bio & Avatar Card */}
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#18181B]">{ui("Creator Identity")}</h3>
                  <span className="text-[10px] font-mono uppercase bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-md">
                    {ui("Published autosave")}</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <img
                      src={profile.avatarUrl}
                      alt={profile.displayName}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-neutral-200"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="absolute inset-0 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-semibold cursor-pointer"
                    >
                      {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-neutral-300 hover:border-black transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5 text-neutral-500" />
                        <span>{uploadingImage ? ui("Uploading...") : ui("Upload Avatar Image")}</span>
                      </button>
                    </div>
                    {avatarError && (
                      <p role="alert" className="text-xs text-rose-600 font-medium">
                        {avatarError}
                      </p>
                    )}
                    <p className="text-[11px] text-neutral-500">
                      {ui("Supports JPG, PNG, WEBP up to 5MB. Stored directly on server.")}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 mb-1">{ui("Display Name")}</label>
                    <input aria-label={ui("Display Name")}
                      type="text"
                      value={profile.displayName}
                      onChange={(e) => handleProfileChange('displayName', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 font-semibold text-neutral-900 focus:ring-1 focus:ring-neutral-900/10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 mb-1">{ui("Category / Tag")}</label>
                    <input aria-label={ui("Category / Tag")}
                      type="text"
                      value={profile.category}
                      onChange={(e) => handleProfileChange('category', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900 focus:ring-1 focus:ring-neutral-900/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1">{ui("Short Bio")}</label>
                  <textarea aria-label={ui("Short Bio")}
                    rows={2}
                    value={profile.bio}
                    onChange={(e) => handleProfileChange('bio', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900 resize-none focus:ring-1 focus:ring-neutral-900/10"
                  />
                </div>

                {/* Social Links Manager */}
                <div className="pt-3 border-t border-neutral-100">
                  <label className="block text-xs font-bold text-neutral-900 mb-2">{ui("Connected Social Icons")}</label>
                  
                  {/* Current socials list */}
                  <div className="space-y-2 mb-3">
                    {profile.socials && profile.socials.length > 0 ? (
                      profile.socials.map((soc, sIdx) => (
                        <div key={sIdx} className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className="capitalize font-bold text-neutral-700 font-mono text-[11px] bg-neutral-200 px-2 py-0.5 rounded">
                              {soc.platform}
                            </span>
                            <span className="text-neutral-600 truncate font-mono text-[11px]">{soc.url}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSocial(sIdx)}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/30 rounded"
                            title={ui("Remove social link")}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-neutral-400">{ui("No social links added yet.")}</p>
                    )}
                  </div>

                  {/* Add social link form */}
                  <div className="flex items-center gap-2">
                    <select aria-label={ui("Connected Social Icons")}
                      value={newSocialPlatform}
                      onChange={(e) => setNewSocialPlatform(e.target.value as SocialLink['platform'])}
                      className="px-2.5 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold outline-none focus:border-neutral-900"
                    >
                      <option value="instagram">{ui("Instagram")}</option>
                      <option value="twitter">{ui("X / Twitter")}</option>
                      <option value="youtube">{ui("YouTube")}</option>
                      <option value="spotify">{ui("Spotify")}</option>
                      <option value="github">{ui("GitHub")}</option>
                      <option value="linkedin">{ui("LinkedIn")}</option>
                      <option value="email">{ui("Email")}</option>
                    </select>

                    <input aria-label={ui("Connected Social Icons")}
                      type="text"
                      value={newSocialUrl}
                      onChange={(e) => setNewSocialUrl(e.target.value)}
                      placeholder="https://instagram.com/yourhandle"
                      className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs outline-none focus:border-neutral-900 font-mono"
                    />

                    <button
                      type="button"
                      onClick={handleAddSocial}
                      className="px-3 py-1.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                    >
                      {ui("Add")}</button>
                  </div>
                </div>

              </div>

              {/* Action Bar: Add Block & Import Links */}
              <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs" aria-labelledby="pages-heading">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 id="pages-heading" className="text-sm font-bold text-neutral-900">{ui('Pages')}</h2>
                    <p className="mt-1 text-[11px] text-neutral-500">{ui('Create separate pages and publish them from your profile navigation.')}</p>
                  </div>
                  <div className="flex flex-wrap gap-2" role="tablist" aria-label={ui('Profile pages')}>
                    {pages.map(page => <button key={page.id} type="button" role="tab" aria-selected={page.id === activePage?.id} onClick={() => setActivePageId(page.id)} className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${page.id === activePage?.id ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-700 hover:border-neutral-500'}`}>{page.title}{page.isHome ? ` (${ui('Home')})` : ''}</button>)}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input value={newPageTitle} onChange={event => setNewPageTitle(event.target.value)} placeholder={ui('New page title')} aria-label={ui('New page title')} className="rounded-xl border border-neutral-200 px-3 py-2 text-xs text-neutral-900" />
                  <input value={newPageSlug} onChange={event => setNewPageSlug(event.target.value.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase())} placeholder={ui('url-slug')} aria-label={ui('New page URL slug')} className="rounded-xl border border-neutral-200 px-3 py-2 font-mono text-xs text-neutral-900" />
                  <button type="button" onClick={handleCreatePage} className="rounded-xl bg-neutral-900 px-3 py-2 text-xs font-bold text-white hover:bg-black">{ui('Add page')}</button>
                </div>
                {activePage && <div className="mt-4 grid grid-cols-1 gap-2 border-t border-neutral-100 pt-4 sm:grid-cols-2">
                  <label className="grid gap-1 text-[11px] font-semibold text-neutral-700">{ui('Page title')}<input value={pageEditTitle} onChange={event => setPageEditTitle(event.target.value)} aria-label={ui('Page title')} className="rounded-xl border border-neutral-200 px-3 py-2 text-xs text-neutral-900" /></label>
                  <label className="grid gap-1 text-[11px] font-semibold text-neutral-700">{ui('URL slug')}<input value={pageEditSlug} disabled={activePage.isHome} onChange={event => setPageEditSlug(event.target.value.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase())} aria-label={ui('URL slug')} className="rounded-xl border border-neutral-200 px-3 py-2 font-mono text-xs text-neutral-900 disabled:bg-neutral-100" /></label>
                  <label className="grid gap-1 text-[11px] font-semibold text-neutral-700 sm:col-span-2">{ui('Description')}<textarea value={pageEditDescription} onChange={event => setPageEditDescription(event.target.value)} aria-label={ui('Page description')} maxLength={240} rows={2} className="rounded-xl border border-neutral-200 px-3 py-2 text-xs text-neutral-900" /></label>
                  <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                    {!activePage.isHome && <div className="sm:col-span-2 space-y-1"><label className="flex items-center gap-2 text-xs font-semibold text-neutral-700"><input type="checkbox" checked={pageEditPublished} onChange={event => setPageEditPublished(event.target.checked)} />{ui('Published')}</label><p className="text-[11px] font-normal text-neutral-500">{ui('Changes save directly to the published page. Unpublished pages are hidden; Liinx does not keep a separate draft revision.')}</p></div>}
                    <button type="button" onClick={handleSavePage} disabled={isSavingPage} className="rounded-xl border border-neutral-300 px-3 py-2 text-xs font-bold text-neutral-900 hover:border-neutral-900 disabled:opacity-50">{isSavingPage ? ui('Saving…') : ui('Save page settings')}</button>
                    <button type="button" onClick={() => handleMovePage(-1)} disabled={activePage.isHome || pages.findIndex(page => page.id === activePage.id) <= 1} aria-label={ui('Move page left')} className="rounded-xl border border-neutral-200 px-2 py-2 text-xs font-bold disabled:opacity-30">←</button>
                    <button type="button" onClick={() => handleMovePage(1)} disabled={pages.findIndex(page => page.id === activePage.id) === pages.length - 1} aria-label={ui('Move page right')} className="rounded-xl border border-neutral-200 px-2 py-2 text-xs font-bold disabled:opacity-30">→</button>
                  </div>
                </div>}
                {activePage && !activePage.isHome && <button type="button" onClick={() => setDeletePageId(activePage.id)} className="mt-3 text-xs font-semibold text-rose-600 hover:text-rose-800">{ui('Delete current page')}</button>}
                {pageManagerError && <p role="alert" className="mt-2 text-xs text-rose-700">{pageManagerError}</p>}
              </section>
              <BookingEditor onSave={async (title, url) => {
                const block = await createBlockForPage({ type: 'booking', title, url });
                setProfile(prev => ({ ...prev, blocks: [...prev.blocks, block] }));
              }} />
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="w-full py-3.5 px-4 rounded-2xl bg-neutral-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 focus-visible:ring-offset-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{ui("Add New Link or Block to Profile")}</span>
                  </button>

                  {showAddMenu && (
                    <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-neutral-50 rounded-2xl border border-neutral-200 shadow-2xl z-20 grid grid-cols-2 sm:grid-cols-3 gap-2 animate-fade-in">
                      <button
                        onClick={handleAddLink}
                        className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 flex flex-col items-center text-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                      >
                        <LinkIcon className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-neutral-900">{ui("Custom Link")}</span>
                      </button>

                      <button
                        onClick={handleAddHeader}
                        className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 flex flex-col items-center text-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                      >
                        <Sliders className="w-4 h-4 text-neutral-700" />
                        <span className="text-xs font-bold text-neutral-900">{ui("Section Title")}</span>
                      </button>

                      <button
                        onClick={handleAddAudio}
                        className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 flex flex-col items-center text-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                      >
                        <Music className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-neutral-900">{ui("Audio Track")}</span>
                      </button>

                      <button
                        onClick={handleAddVideo}
                        className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 flex flex-col items-center text-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                      >
                        <Video className="w-4 h-4 text-red-600" />
                        <span className="text-xs font-bold text-neutral-900">{ui("Video Embed")}</span>
                      </button>

                      <button
                        onClick={handleAddFolder}
                        className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 flex flex-col items-center text-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                      >
                        <FolderPlus className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-bold text-neutral-900">{ui("Link Folder")}</span>
                      </button>

                      <button
                        onClick={handleAddNewsletter}
                        className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 flex flex-col items-center text-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                      >
                        <Mail className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-bold text-neutral-900">{ui("Newsletter")}</span>
                      </button>

                      {[
                        ['rich_text', 'Rich Text'], ['image', 'Image'], ['gallery', 'Gallery'], ['carousel', 'Carousel'],
                        ['spacer', 'Spacer'], ['form', 'Contact Form'], ['download', 'Download'], ['map', 'Location'],
                        ['faq', 'FAQ'], ['testimonials', 'Testimonials'], ['event', 'Event'], ['presave', 'Pre-save'],
                        ['phone', 'Phone'], ['product', 'Product'], ['tips', 'Tips'], ['content_gate', 'Content Gate']
                      ].map(([type, label]) => (
                        <button key={type} onClick={() => handleAddAdvancedBlock(type)} className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 flex flex-col items-center text-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20">
                          <Plus className="w-4 h-4 text-neutral-600" />
                          <span className="text-xs font-bold text-neutral-900">{ui(label)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowImporterModal(true)}
                  className="py-3.5 px-4 rounded-2xl bg-neutral-50 border border-neutral-200 hover:border-emerald-600 text-neutral-900 hover:text-emerald-700 text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 shrink-0"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>{ui("Import Linktree")}</span>
                </button>
              </div>

              {/* Block List Draggable/Reorderable */}
              <div className="space-y-3">
                {visibleBlocks.map((block, index) => (
                  <div 
                    key={block.id}
                    className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 shadow-xs space-y-3 hover:border-neutral-400 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-neutral-100 text-neutral-600">
                          {block.type}
                        </span>
                        <span className="text-xs font-bold text-[#18181B] truncate">
                          {block.title || 'Untitled Block'}
                        </span>
                        {(block as LinkBlock).clicks !== undefined && (
                          <span className="text-[10px] font-mono text-emerald-600 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <MousePointerClick className="w-3 h-3" />
                            <span>{(block as LinkBlock).clicks} {ui("clicks")}</span>
                          </span>
                        )}
                        {getScheduleStatus((block as LinkBlock).startAt, (block as LinkBlock).endAt) && (
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            getScheduleStatus((block as LinkBlock).startAt, (block as LinkBlock).endAt)?.color
                          }`}>
                            {getScheduleStatus((block as LinkBlock).startAt, (block as LinkBlock).endAt)?.label}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveBlock(index, 'up')}
                          disabled={index === 0}
                          aria-label={ui('Move block up')}
                          className="p-1 rounded-lg text-neutral-400 hover:text-black disabled:opacity-20 cursor-pointer"
                          title={ui("Move up")}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveBlock(index, 'down')}
                          disabled={index === visibleBlocks.length - 1}
                          aria-label={ui('Move block down')}
                          className="p-1 rounded-lg text-neutral-400 hover:text-black disabled:opacity-20 cursor-pointer"
                          title={ui("Move down")}
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <select
                          aria-label={ui('Move block to page')}
                          value={(block as any).pageId || activePage?.id || ''}
                          onChange={event => void handleMoveBlockToPage(block.id, event.target.value)}
                          className="max-w-28 rounded-lg border border-neutral-200 bg-white px-1 py-1 text-[10px] text-neutral-700"
                        >
                          {pages.map(page => <option key={page.id} value={page.id}>{page.title}</option>)}
                        </select>
                        <button type="button" onClick={() => void handleDuplicateBlock(block.id)} aria-label={ui('Duplicate block')} title={ui('Duplicate block')} className="rounded-lg p-1 text-neutral-400 hover:text-black">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        {confirmDeleteBlockId === block.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                handleDeleteBlock(block.id);
                                setConfirmDeleteBlockId(null);
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-700 text-white hover:bg-rose-800 transition-colors cursor-pointer"
                            >
                              {ui("Confirm")}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteBlockId(null)}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
                            >
                              {ui("Cancel")}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteBlockId(block.id)}
                            className="p-1 rounded-lg text-rose-400 hover:text-rose-600 cursor-pointer"
                            title={ui("Delete block")}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Form Fields per Block Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui("Title")}</label>
                        <input aria-label={ui("Title")}
                          type="text"
                          value={block.title}
                          onChange={(e) => handleUpdateBlockField(block.id, 'title', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900"
                        />
                      </div>

                      {(block.type === 'link' || block.type === 'booking') && (
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui("Destination URL")}</label>
                          <input aria-label={ui("Destination URL")}
                            type="text"
                            value={(block as LinkBlock).url || ''}
                            onChange={(e) => handleUpdateBlockField(block.id, 'url', e.target.value)}
                            placeholder="https://..."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 font-mono text-[11px] text-neutral-900"
                          />
                        </div>
                      )}

                      {block.type === 'audio' && (
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui("Artist Name")}</label>
                          <input aria-label={ui("Artist Name")}
                            type="text"
                            value={(block as AudioBlock).artist || ''}
                            onChange={(e) => handleUpdateBlockExtra(block.id, { artist: e.target.value })}
                            placeholder={ui("Artist / Band")}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900"
                          />
                        </div>
                      )}

                      {block.type === 'video' && (
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui("Video Stream URL")}</label>
                          <input aria-label={ui("Video Stream URL")}
                            type="text"
                            value={(block as VideoBlock).videoUrl || ''}
                            onChange={(e) => handleUpdateBlockExtra(block.id, { videoUrl: e.target.value })}
                            placeholder="https://youtube.com/watch?v=..."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 font-mono text-[11px] text-neutral-900"
                          />
                        </div>
                      )}

                      {block.type === 'newsletter' && (
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui("Button CTA Text")}</label>
                          <input aria-label={ui("Button CTA Text")}
                            type="text"
                            value={(block as NewsletterBlock).buttonText || 'Subscribe'}
                            onChange={(e) => handleUpdateBlockExtra(block.id, { buttonText: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900"
                          />
                        </div>
                      )}
                    </div>

                    {/* Secondary Fields per Block Type */}
                      {block.type === 'link' && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          <div>
                            <label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui("Subtitle Note")}</label>
                            <input aria-label={ui("Subtitle Note")}
                              type="text"
                              value={(block as LinkBlock).subtitle || ''}
                              onChange={(e) => handleUpdateBlockField(block.id, 'subtitle', e.target.value)}
                              placeholder={ui("Supporting text...")}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui("Badge Tag")}</label>
                            <input aria-label={ui("Badge Tag")}
                              type="text"
                              value={(block as LinkBlock).badge || ''}
                              onChange={(e) => handleUpdateBlockField(block.id, 'badge', e.target.value)}
                              placeholder={ui("e.g. NEW, SALE, LISTEN")}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-neutral-100 text-xs">
                          <label className="text-[11px] font-semibold text-neutral-600">{ui('Link layout')}<select value={(block as any).layout || 'list'} onChange={e => handleUpdateBlockExtra(block.id, { layout: e.target.value })} className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[11px] text-neutral-900"><option value="list">{ui('List')}</option><option value="grid">{ui('Grid card')}</option><option value="featured">{ui('Featured')}</option></select></label>
                          <label className="text-[11px] font-semibold text-neutral-600">{ui('Link animation')}<select value={(block as any).animation || 'none'} onChange={e => handleUpdateBlockExtra(block.id, { animation: e.target.value })} className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[11px] text-neutral-900"><option value="none">{ui('None')}</option><option value="fade">{ui('Fade in')}</option><option value="lift">{ui('Lift on hover')}</option><option value="pulse">{ui('Subtle pulse')}</option></select></label>
                        </div>

                        {/* Link Scheduling (Time-Release) */}
                        <div className="pt-2 border-t border-neutral-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-semibold text-neutral-600 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-neutral-500" />
                              <span>{ui("Link Scheduling & Time-Release")}</span>
                            </label>
                            {profile.plan === 'free' ? (
                              <span className="text-[9px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
                                {ui("PRO FEATURE")}</span>
                            ) : (
                              getScheduleStatus((block as LinkBlock).startAt, (block as LinkBlock).endAt) && (
                                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  getScheduleStatus((block as LinkBlock).startAt, (block as LinkBlock).endAt)?.color
                                }`}>
                                  {getScheduleStatus((block as LinkBlock).startAt, (block as LinkBlock).endAt)?.label}
                                </span>
                              )
                            )}
                          </div>

                          {profile.plan !== 'free' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <span className="text-neutral-400 block mb-1">{ui("Publish (Start Date/Time):")}</span>
                                <input
                                  type="datetime-local"
                                  value={toDateTimeLocal((block as LinkBlock).startAt)}
                                  onChange={(e) => handleUpdateBlockField(block.id, 'startAt', fromDateTimeLocal(e.target.value))}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-800 focus:outline-none focus:border-neutral-900 font-mono text-[11px]"
                                />
                              </div>
                              <div>
                                <span className="text-neutral-400 block mb-1">{ui("Unpublish (End Date/Time):")}</span>
                                <input
                                  type="datetime-local"
                                  value={toDateTimeLocal((block as LinkBlock).endAt)}
                                  onChange={(e) => handleUpdateBlockField(block.id, 'endAt', fromDateTimeLocal(e.target.value))}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-800 focus:outline-none focus:border-neutral-900 font-mono text-[11px]"
                                />
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-neutral-400">
                              {ui("Upgrade to Pro to automatically schedule links to go live and expire at specific dates and times.")}</p>
                          )}
                        </div>
                      </>
                    )}

                    {block.type === 'audio' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui("Album Cover Image URL")}</label>
                          <input aria-label={ui("Album Cover Image URL")}
                            type="text"
                            value={(block as AudioBlock).coverUrl || ''}
                            onChange={(e) => handleUpdateBlockExtra(block.id, { coverUrl: e.target.value })}
                            placeholder="https://..."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 font-mono text-[11px] text-neutral-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui("Streaming Link")}</label>
                          <input aria-label={ui("Streaming Link")}
                            type="text"
                            value={(block as AudioBlock).audioUrl || ''}
                            onChange={(e) => handleUpdateBlockExtra(block.id, { audioUrl: e.target.value })}
                            placeholder="https://open.spotify.com/..."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 font-mono text-[11px] text-neutral-900"
                          />
                        </div>
                      </div>
                    )}

                    {block.type === 'video' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui("Thumbnail Preview Image URL")}</label>
                        <input aria-label={ui("Thumbnail Preview Image URL")}
                          type="text"
                          value={(block as VideoBlock).thumbnailUrl || ''}
                          onChange={(e) => handleUpdateBlockExtra(block.id, { thumbnailUrl: e.target.value })}
                          placeholder="https://..."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 font-mono text-[11px] text-neutral-900"
                        />
                      </div>
                    )}

                    {block.type === 'newsletter' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui("Newsletter Description")}</label>
                        <input aria-label={ui("Newsletter Description")}
                          type="text"
                          value={(block as NewsletterBlock).description || ''}
                          onChange={(e) => handleUpdateBlockExtra(block.id, { description: e.target.value })}
                          placeholder={ui("What will subscribers get?")}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900"
                        />
                      </div>
                    )}

                    {['rich_text', 'image', 'gallery', 'carousel', 'spacer', 'form', 'download', 'map', 'faq', 'testimonials', 'event', 'presave', 'phone', 'product', 'tips', 'content_gate'].includes(block.type) && (() => {
                      const advanced = block as any;
                      const updateAdvanced = (key: string, value: unknown) => handleUpdateBlockExtra(block.id, { [key]: value });
                      const formatRichText = (marker: '**' | '*' | '## ') => {
                        const textarea = document.getElementById(`rich-text-${block.id}`) as HTMLTextAreaElement | null;
                        const current = String(advanced.body || '');
                        if (!textarea) return updateAdvanced('body', `${current}${current ? ' ' : ''}${marker}${marker === '## ' ? 'heading' : marker === '**' ? 'bold' : 'italic'}${marker === '## ' ? '' : marker}`);
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const selected = current.slice(start, end) || (marker === '## ' ? 'heading' : marker === '**' ? 'bold' : 'italic');
                        const replacement = marker === '## ' ? `${marker}${selected}` : `${marker}${selected}${marker}`;
                        updateAdvanced('body', `${current.slice(0, start)}${replacement}${current.slice(end)}`);
                        requestAnimationFrame(() => { textarea.focus(); textarea.setSelectionRange(start + replacement.length, start + replacement.length); });
                      };
                      return <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-neutral-100 text-xs">
                        {(['rich_text', 'form', 'download', 'map', 'content_gate'].includes(block.type)) && <div className="sm:col-span-2"><label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui(block.type === 'rich_text' || block.type === 'content_gate' ? 'Content' : 'Description')}</label>{block.type === 'rich_text' && <div className="mb-1 flex gap-1"><button type="button" onClick={() => formatRichText('**')} className="rounded border border-neutral-200 px-2 py-1 text-[10px] font-bold">B</button><button type="button" onClick={() => formatRichText('*')} className="rounded border border-neutral-200 px-2 py-1 text-[10px] italic">I</button><button type="button" onClick={() => formatRichText('## ')} className="rounded border border-neutral-200 px-2 py-1 text-[10px] font-bold">H</button></div>}<textarea id={block.type === 'rich_text' ? `rich-text-${block.id}` : undefined} value={advanced.body || advanced.description || ''} onChange={e => updateAdvanced(block.type === 'rich_text' || block.type === 'content_gate' ? 'body' : 'description', e.target.value)} className="w-full min-h-20 px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900" /></div>}
                        {block.type === 'image' && <div><label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui('Image URL')}</label><input value={advanced.imageUrl || ''} onChange={e => updateAdvanced('imageUrl', e.target.value)} placeholder="https://..." className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900" /><input type="file" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (file) void handleBlockImageUpload(block.id, file); }} aria-label={ui('Upload image')} className="mt-2 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[11px] text-neutral-900" /></div>}
                        {['download', 'event', 'presave', 'product', 'tips', 'form'].includes(block.type) && <div><label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui('Destination URL')}</label><input value={advanced.fileUrl || advanced.url || ''} onChange={e => updateAdvanced(block.type === 'download' ? 'fileUrl' : 'url', e.target.value)} placeholder="https://..." className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900" />{block.type === 'download' && <input type="file" onChange={e => { const file = e.target.files?.[0]; if (file) void handleBlockFileUpload(block.id, file); }} aria-label={ui('Upload downloadable file')} className="mt-2 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[11px] text-neutral-900" />}</div>}
                        {block.type === 'map' && <div><label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui('Location')}</label><input value={advanced.location || ''} onChange={e => updateAdvanced('location', e.target.value)} placeholder={ui('City or address')} className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900" /></div>}
                        {block.type === 'phone' && <div><label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui('Phone number')}</label><input value={advanced.phone || ''} onChange={e => updateAdvanced('phone', e.target.value)} placeholder="+1..." className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900" /></div>}
                        {['gallery', 'carousel', 'faq', 'testimonials', 'form'].includes(block.type) && <StructuredItemsEditor kind={block.type as StructuredEditorKind} value={advanced.items || advanced.fields || []} onChange={items => updateAdvanced(block.type === 'form' ? 'fields' : 'items', items)} onUpload={(file, index) => void handleBlockImageUpload(block.id, file, 'imageUrl', index)} ui={ui} />}
                        {block.type === 'spacer' && <div><label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui('Height (px)')}</label><input type="number" min="16" max="240" value={advanced.height || 48} onChange={e => updateAdvanced('height', Number(e.target.value))} className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900" /></div>}
                        {block.type === 'content_gate' && <div><label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui('Access code')}</label><input type="password" value={advanced.password || ''} onChange={e => updateAdvanced('password', e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900" /></div>}
                      </div>;
                    })()}

                    {block.type === 'folder' && (
                      <div className="space-y-2 pt-2 border-t border-neutral-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-neutral-700">{ui("Folder Links")}</span>
                          <button
                            type="button"
                            onClick={() => handleAddFolderItem(block.id)}
                            className="text-[11px] text-blue-600 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> {ui("Add Item")}</button>
                        </div>
                        {((block as FolderBlock).items || []).map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <input aria-label={ui("Title")}
                              type="text"
                              value={item.title}
                              onChange={(e) => handleUpdateFolderItem(block.id, item.id, 'title', e.target.value)}
                              placeholder={ui("Title")}
                              className="w-1/3 px-2 py-1 rounded border border-neutral-200 text-[11px] bg-neutral-50 text-neutral-900"
                            />
                            <input aria-label={ui("Destination URL")}
                              type="text"
                              value={item.url}
                              onChange={(e) => handleUpdateFolderItem(block.id, item.id, 'url', e.target.value)}
                              placeholder="https://..."
                              className="flex-1 px-2 py-1 rounded border border-neutral-200 text-[11px] font-mono bg-neutral-50 text-neutral-900"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveFolderItem(block.id, item.id)}
                              className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 2: THEMES & APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-neutral-900">{ui("Curated Visual Presets")}</h3>
                <p className="text-xs text-neutral-500">
                  {ui("Choose from carefully crafted aesthetic profiles. Every palette is built with strong contrast and responsive tokens.")}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {THEMES.map((th) => (
                    <button
                      key={th.id}
                      onClick={() => handleThemeSelect(th)}
                      className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${
                        customTheme.id === th.id 
                          ? 'border-neutral-900 ring-2 ring-neutral-900/10 shadow-sm bg-neutral-50' 
                          : 'border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-7 h-7 rounded-full shadow-inner border border-black/10 shrink-0" 
                          style={{ background: th.bgType === 'gradient' ? th.bgGradient : th.bgColor }}
                        />
                        <div>
                          <p className="font-bold text-xs text-neutral-900">{th.name}</p>
                          <p className="text-[10px] text-neutral-500 font-mono capitalize">{th.fontFamily} {ui("font")}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${th.isDark ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-900'}`}>
                        {th.isDark ? ui("Dark") : ui("Light")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Geometry & Radius Control */}
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-neutral-900">{ui("Card Geometry & Accent Tint")}</h3>
                
                <div className="grid grid-cols-4 gap-2">
                  {(['none', 'md', 'xl', 'full'] as const).map((rad) => (
                    <button
                      key={rad}
                      onClick={() => {
                        const updated = { ...customTheme, cardRadius: rad };
                        setCustomTheme(updated);
                        triggerAutoSave({ customTheme: updated });
                      }}
                      className={`py-2 px-3 border rounded-xl text-xs font-semibold capitalize transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${
                        customTheme.cardRadius === rad 
                          ? 'border-neutral-900 bg-neutral-900 text-white' 
                          : 'border-neutral-200 bg-neutral-50 text-neutral-900 hover:bg-neutral-100'
                      }`}
                    >
                      {rad === 'none' ? ui("Square") : rad === 'full' ? ui("Pill") : rad}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-[#71717A] mb-2">{ui("Brand Accent Color")}</label>
                  <div className="flex items-center gap-2.5">
                    {['#B45309', '#3B82F6', '#EC4899', '#10B981', '#18181B', '#8B5CF6'].map((col) => (
                      <button
                        key={col}
                        onClick={() => {
                          const updated = { ...customTheme, accentColor: col };
                          setCustomTheme(updated);
                          triggerAutoSave({ customTheme: updated });
                        }}
                        className={`w-8 h-8 rounded-full border transition-transform cursor-pointer ${
                          customTheme.accentColor === col ? 'ring-2 ring-black scale-110' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REAL ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 shadow-xs">
                  <span className="text-xs text-neutral-500">{ui("30-Day Views")}</span>
                  <p className="text-2xl font-extrabold text-neutral-900 mt-1 tabular-nums">
                    {analyticsData ? analyticsData.totalViews.toLocaleString() : '...'}
                  </p>
                  <span className="text-[10px] text-neutral-500 font-mono tabular-nums">
                    {analyticsData ? `${analyticsData.uniqueVisitors} unique` : ui("loading")}
                  </span>
                </div>

                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 shadow-xs">
                  <span className="text-xs text-neutral-500">{ui("Click-Through")}</span>
                  <p className="text-2xl font-extrabold text-emerald-600 mt-1 tabular-nums">
                    {analyticsData ? analyticsData.ctr : '...'}
                  </p>
                  <span className="text-[10px] text-emerald-700 font-semibold font-mono">{ui("Clicks per view")}</span>
                </div>

                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 shadow-xs">
                  <span className="text-xs text-neutral-500">{ui("Total Clicks")}</span>
                  <p className="text-2xl font-extrabold text-neutral-900 mt-1 tabular-nums">
                    {analyticsData ? analyticsData.totalClicks.toLocaleString() : '...'}
                  </p>
                  <span className="text-[10px] text-neutral-500 font-mono">{ui("Live logged")}</span>
                </div>
              </div>

              {/* 7-Day Daily Bar Chart */}
              {analyticsData && analyticsData.dailyTimeline && (
                <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span>{ui("7-Day Engagement Timeline")}</span>
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] font-mono">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-neutral-200 rounded" /> {ui("Views")}</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded" /> {ui("Clicks")}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2 pt-2 items-end h-32">
                    {analyticsData.dailyTimeline.map((day, idx) => {
                      const maxVal = Math.max(...analyticsData.dailyTimeline.map(d => Math.max(d.views, 1)));
                      const viewHeight = Math.max(8, Math.round((day.views / maxVal) * 100));
                      const clickHeight = Math.max(4, Math.round((day.clicks / maxVal) * 100));

                      return (
                        <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                          <div className="w-full flex gap-1 items-end justify-center h-24">
                            <div 
                              className="w-3 bg-neutral-200 rounded-t transition-[height] duration-300" 
                              style={{ height: `${viewHeight}%` }}
                              title={`${day.views} views`}
                            />
                            <div 
                              className="w-3 bg-emerald-500 rounded-t transition-[height] duration-300" 
                              style={{ height: `${clickHeight}%` }}
                              title={`${day.clicks} clicks`}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-neutral-500 truncate w-full text-center">
                            {day.date.split(',')[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Top Performing Links */}
              {analyticsData && analyticsData.topLinks && (
                <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-neutral-900">{ui("Top Performing Links")}</h3>
                  {analyticsData.topLinks.length === 0 ? (
                    <p className="text-xs text-neutral-400 py-2">{ui("No clicks recorded yet. Share your link to start tracking!")}</p>
                  ) : (
                    <div className="space-y-2.5 text-xs">
                      {analyticsData.topLinks.map((link) => (
                        <div key={link.id} className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-semibold truncate max-w-xs">{link.title}</span>
                            <span className="font-mono text-neutral-500 tabular-nums">{link.clicks} {ui("clicks (")}{link.percentage}%)</span>
                          </div>
                          <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-neutral-900 rounded-full transition-[width] duration-300" 
                              style={{ width: `${Math.min(100, Math.max(4, link.percentage))}%` }} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* UTM Campaign & Traffic Attribution */}
              {analyticsData && (
                <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-neutral-900">{ui("UTM Campaign & Traffic Attribution")}</h3>
                    <span className="text-[10px] font-mono text-neutral-500">{ui("Source / Medium / Campaign")}</span>
                  </div>
                  {!analyticsData.topUtmCampaigns || analyticsData.topUtmCampaigns.length === 0 ? (
                    <p className="text-xs text-neutral-400 py-2">
                      {ui("No UTM parameters recorded yet. Append")}<code className="bg-neutral-100 px-1 py-0.5 rounded text-neutral-700 font-mono text-[10px]">{ui("?utm_source=instagram&utm_campaign=spring")}</code> {ui("to your bio URL to start tracking!")}</p>
                  ) : (
                    <div className="divide-y divide-neutral-100 text-xs">
                      {analyticsData.topUtmCampaigns.map((utm, idx) => (
                        <div key={idx} className="py-2.5 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="font-semibold text-neutral-900">{utm.campaign}</span>
                            <span className="text-[11px] font-mono text-neutral-500">{utm.source} / {utm.medium}</span>
                          </div>
                          <span className="font-mono font-bold text-neutral-800 tabular-nums">{utm.count} {ui("views")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SETTINGS, SUBSCRIBERS & PLAN */}
          {activeTab === 'settings' && (
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
                    {ui("ACTIVE")}</span>
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
                      {ui("Remove the \"Made with LIINX\" badge from your bio page and footer.")}</p>
                  </div>
                  {profile.plan === 'free' ? (
                    <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-1 rounded-md">
                      {ui("PRO FEATURE")}</span>
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
                    {ui("Upgrade to Pro or Studio to completely remove all LIINX branding badges.")}</p>
                )}
              </div>

              {/* Google Analytics 4 & Meta Pixel Tracking Card */}
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900">{ui("Analytics & Retargeting Pixels")}</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {ui("Connect your Google Analytics 4 Measurement ID and Meta Pixel to track visitors and run retargeting ads.")}</p>
                  </div>
                  {profile.plan === 'free' ? (
                    <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-1 rounded-md">
                      {ui("PRO FEATURE")}</span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-md">
                      {ui("ACTIVE")}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-800">{ui("Google Analytics 4 Measurement ID")}</label>
                    <input aria-label={ui("Google Analytics 4 Measurement ID")}
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
                    <label className="text-xs font-semibold text-neutral-800">{ui("Meta (Facebook) Pixel ID")}</label>
                    <input aria-label={ui("Meta (Facebook) Pixel ID")}
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
                      onClick={async () => {
                        setIsSavingPixels(true);
                        setPixelsError(null);
                        try {
                          await api.studio.updateProfile({
                            gaMeasurementId: gaInput.trim() || null,
                            metaPixelId: metaPixelInput.trim() || null
                          });
                          setProfile(prev => ({
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
                      }}
                      className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                    >
                      {isSavingPixels ? ui("Saving...") : ui("Save Tracking IDs")}
                    </button>
                  </div>
                )}
              </div>

              {/* Custom Domain Setup Card (Milestone 6) */}
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
                      <Globe2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-neutral-900">{ui("Custom Domain")}</h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {ui("Link your own domain or subdomain (e.g.")}<span className="font-mono">links.yourbrand.com</span>{ui(") directly to your bio page.")}</p>
                    </div>
                  </div>
                  {profile.plan === 'free' ? (
                    <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-1 rounded-md">
                      {ui("PRO / STUDIO")}</span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-md">
                      {ui("AVAILABLE")}</span>
                  )}
                </div>

                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-800">{ui("Domain / Subdomain Name")}</label>
                    <input aria-label={ui("Domain / Subdomain Name")}
                      type="text"
                      disabled={profile.plan === 'free'}
                      value={customDomainInput}
                      onChange={e => setCustomDomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ''))}
                      placeholder={ui("e.g. links.sarahcreator.com")}
                      className="w-full text-xs font-mono p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-neutral-50 focus:border-neutral-900 outline-none transition-colors disabled:opacity-50"
                    />
                  </div>

                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1 text-xs">
                    <span className="font-semibold text-neutral-800 block">{ui("DNS Configuration Instructions:")}</span>
                    <p className="text-neutral-500 text-[11px]">
                      {ui("Add a")}<span className="font-mono font-bold text-neutral-900">{ui("CNAME")}</span> {ui("record at your DNS provider pointing to:")}</p>
                    <div className="flex items-center justify-between bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200 font-mono text-xs">
                      <span>{ui("cname.liinx.app")}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText('cname.liinx.app');
                          setCopiedCname(true);
                          setTimeout(() => setCopiedCname(false), 2000);
                        }}
                        className="text-[10px] text-neutral-500 hover:text-black font-sans font-semibold cursor-pointer"
                      >
                        {copiedCname ? ui("Copied!") : ui("Copy Target")}</button>
                    </div>
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
                        onClick={async () => {
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
                              message: friendlyErrorMessage(err, 'We could not verify the domain right now. Check your DNS records and try again.')
                            });
                          } finally {
                            setIsVerifyingDns(false);
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-xs font-semibold text-neutral-800 cursor-pointer disabled:opacity-50"
                      >
                        {isVerifyingDns ? ui("Checking DNS...") : ui("Verify DNS")}
                      </button>

                      <button
                        type="button"
                        disabled={isSavingDomain}
                        onClick={async () => {
                          setIsSavingDomain(true);
                          setDomainFeedback(null);
                          try {
                            const val = customDomainInput.trim() || null;
                            await api.studio.updateProfile({ customDomain: val });
                            setProfile(prev => ({ ...prev, customDomain: val }));
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
                        }}
                        className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isSavingDomain ? ui("Saving...") : ui("Save Domain")}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Custom CSS & Custom Font Card (Milestone 7) */}
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
                      <Code className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-neutral-900">{ui("Custom CSS & Custom Webfonts")}</h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {ui("Inject custom stylesheet overrides and Google Fonts to match your brand guide.")}</p>
                    </div>
                  </div>
                  {profile.plan === 'free' ? (
                    <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-1 rounded-md">
                      {ui("PRO / STUDIO")}</span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-md">
                      {ui("ACTIVE")}</span>
                  )}
                </div>

                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-800">{ui("Google Fonts / Webfont Stylesheet URL")}</label>
                    <input aria-label={ui("Google Fonts / Webfont Stylesheet URL")}
                      type="url"
                      disabled={profile.plan === 'free'}
                      value={customFontUrlInput}
                      onChange={e => setCustomFontUrlInput(e.target.value)}
                      placeholder="https://fonts.googleapis.com/css2?family=Playfair+Display&display=swap"
                      className="w-full text-xs font-mono p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-neutral-50 focus:border-neutral-900 outline-none transition-colors disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-neutral-800">{ui("Custom CSS Overrides")}</label>
                      <span className="text-[10px] font-mono text-neutral-400">{ui("Scoped to #public-bio-view")}</span>
                    </div>
                    <textarea aria-label={ui("/* Custom CSS overrides */\n#public-bio-view .custom-card { border-width: 2px; }")}
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
                        onClick={async () => {
                          setIsSavingStyling(true);
                          setStylingError(null);
                          try {
                            await api.studio.updateProfile({
                              customCss: customCssInput.trim() || null,
                              customFontUrl: customFontUrlInput.trim() || null
                            });
                            setProfile(prev => ({
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
                        }}
                        className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isSavingStyling ? ui("Saving...") : ui("Save Custom CSS & Fonts")}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Public page controls: sharing, media, redirects, and reusable branding */}
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900">{ui('Public Page Controls')}</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">{ui('Control how your page appears when shared and what visitors see in the background.')}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-neutral-800">{ui('Share title')}<input value={shareTitleInput} onChange={e => setShareTitleInput(e.target.value)} maxLength={160} className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900" placeholder={profile.displayName} /></label>
                  <label className="text-xs font-semibold text-neutral-800">{ui('Share image URL')}<input type="url" value={shareImageUrlInput} onChange={e => setShareImageUrlInput(e.target.value)} className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900" placeholder="https://..." /></label>
                  <label className="sm:col-span-2 text-xs font-semibold text-neutral-800">{ui('Share description')}<textarea value={shareDescriptionInput} onChange={e => setShareDescriptionInput(e.target.value)} maxLength={300} rows={2} className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900" /></label>
                  <label className="text-xs font-semibold text-neutral-800">{ui('Footer logo URL')}<input type="url" disabled={profile.plan === 'free'} value={footerLogoUrlInput} onChange={e => setFooterLogoUrlInput(e.target.value)} className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900 disabled:opacity-50" placeholder="https://..." /></label>
                  <label className="text-xs font-semibold text-neutral-800">{ui('Background media URL')}<input type="url" disabled={profile.plan === 'free'} value={backgroundMediaUrlInput} onChange={e => setBackgroundMediaUrlInput(e.target.value)} className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900 disabled:opacity-50" placeholder="https://..." /></label>
                  <label className="text-xs font-semibold text-neutral-800">{ui('Background type')}<select disabled={profile.plan === 'free'} value={backgroundMediaTypeInput} onChange={e => setBackgroundMediaTypeInput(e.target.value as 'image' | 'video')} className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900 disabled:opacity-50"><option value="image">{ui('Image')}</option><option value="video">{ui('Video')}</option></select></label>
                  <label className="text-xs font-semibold text-neutral-800">{ui('Temporary page redirect')}<input type="url" value={pageRedirectUrlInput} onChange={e => setPageRedirectUrlInput(e.target.value)} className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900" placeholder="https://..." /></label>
                  <label className="text-xs font-semibold text-neutral-800">{ui('Redirect ends')}<input type="datetime-local" value={pageRedirectUntilInput} onChange={e => setPageRedirectUntilInput(e.target.value)} className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900" /></label>
                </div>
                {pageSettingsFeedback && <p role="status" className="text-xs text-emerald-700">{pageSettingsFeedback}</p>}
                <button type="button" disabled={isSavingPageSettings} onClick={async () => { setIsSavingPageSettings(true); setPageSettingsFeedback(null); try { const data = { shareTitle: shareTitleInput.trim() || null, shareDescription: shareDescriptionInput.trim() || null, shareImageUrl: shareImageUrlInput.trim() || null, footerLogoUrl: footerLogoUrlInput.trim() || null, backgroundMediaUrl: backgroundMediaUrlInput.trim() || null, backgroundMediaType: backgroundMediaUrlInput.trim() ? backgroundMediaTypeInput : null, pageRedirectUrl: pageRedirectUrlInput.trim() || null, pageRedirectUntil: pageRedirectUntilInput ? new Date(pageRedirectUntilInput).getTime() : null }; await api.studio.updateProfile(data); setProfile(prev => ({ ...prev, ...data })); setPageSettingsFeedback(ui('Public page settings saved.')); } catch (error) { setPageSettingsFeedback(friendlyErrorMessage(error, ui('Could not save public page settings.'))); } finally { setIsSavingPageSettings(false); } }} className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{isSavingPageSettings ? ui('Saving...') : ui('Save Public Page Settings')}</button>
              </div>

              {/* Duplicate profile and creator submissions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
                  <h3 className="font-bold text-sm text-neutral-900">{ui('Duplicate this profile')}</h3>
                  <p className="text-xs text-neutral-500">{ui('Create another profile with the same content and design, then choose a new handle.')}</p>
                  <button type="button" onClick={async () => { const username = window.prompt(ui('New username')); if (!username) return; const displayName = window.prompt(ui('Display name'), profile.displayName) || profile.displayName; try { const result = await api.studio.createProfile({ username, displayName, duplicateProfileId: profile.id }); authStorage.setToken(result.token); const next = await api.studio.getProfile(); setProfile(next); setCustomTheme(resolveTheme(next.themeId, next.customTheme)); loadProfilesList(); } catch (error) { setPageSettingsFeedback(friendlyErrorMessage(error, ui('Could not duplicate profile.'))); } }} className="rounded-xl border border-neutral-300 px-4 py-2 text-xs font-bold text-neutral-900 hover:border-neutral-900">{ui('Duplicate Profile')}</button>
                </div>
                <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
                  <h3 className="font-bold text-sm text-neutral-900">{ui('Form submissions')}</h3>
                  <p className="text-xs text-neutral-500">{formSubmissions.length ? `${formSubmissions.length} ${ui('stored responses')}` : ui('No form responses yet.')}</p>
                  <div className="max-h-96 space-y-2 overflow-auto">{(showAllFormSubmissions ? formSubmissions : formSubmissions.slice(0, 3)).map(item => <div key={item.id} className="rounded-xl border border-neutral-200 p-3 text-[11px] text-neutral-700"><span className="font-mono text-neutral-400">{new Date(item.createdAt).toLocaleString()}</span><pre className="mt-1 whitespace-pre-wrap font-sans">{JSON.stringify(item.fields, null, 2)}</pre></div>)}</div>
                  {formSubmissions.length > 3 && <button type="button" onClick={() => setShowAllFormSubmissions(value => !value)} className="text-[11px] font-semibold text-neutral-700 underline">{showAllFormSubmissions ? ui('Show recent only') : ui('View all responses')}</button>}
                </div>
              </div>

              {/* Developer REST API Card (Milestone 8) */}
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
                      <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-neutral-900">{ui("Developer & REST API Access")}</h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {ui("Manage your LIINX link bio programmatically via our public REST API v1.")}</p>
                    </div>
                  </div>
                  {profile.plan !== 'studio' ? (
                    <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-1 rounded-md">
                      {ui("STUDIO TIER ONLY")}</span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-md">
                      {ui("API ENABLED")}</span>
                  )}
                </div>

                {profile.plan !== 'studio' ? (
                  <p className="text-xs text-neutral-500">
                    {ui("REST API keys and programmatic block automation require a Studio subscription. Upgrade to unlock direct API access.")}</p>
                ) : (
                  <div className="space-y-4 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-800">{ui("Active API Keys")}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCreatedApiKey(null);
                          setNewKeyName('');
                          setShowNewKeyModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{ui("Generate Key")}</span>
                      </button>
                    </div>

                    {apiKeyError && (
                      <div role="alert" className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                        {apiKeyError}
                      </div>
                    )}

                    {apiKeyList.length === 0 ? (
                      <div className="py-6 text-center text-xs text-neutral-400 border border-dashed rounded-xl">
                        {ui("No API keys generated yet. Click \"Generate Key\" to create your first API credential.")}</div>
                    ) : (
                      <div className="divide-y divide-neutral-100 border rounded-xl overflow-hidden text-xs">
                        {apiKeyList.map(k => (
                          <div key={k.id} className="p-3 flex items-center justify-between gap-3">
                            <div className="flex flex-col">
                              <span className="font-bold text-neutral-900">{k.name}</span>
                              <span className="font-mono text-[11px] text-neutral-400">{k.prefix}</span>
                            </div>
                            {confirmRevokeKeyId === k.id ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    setApiKeyError(null);
                                    try {
                                      await api.studio.revokeApiKey(k.id);
                                      setConfirmRevokeKeyId(null);
                                      loadApiKeys();
                                    } catch (err: any) {
                                      setApiKeyError(friendlyErrorMessage(err, ui('Failed to revoke key')));
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-[11px] font-bold transition-colors cursor-pointer"
                                >
                                  {ui("Confirm Revoke")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmRevokeKeyId(null)}
                                  className="px-2 py-1 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-[11px] font-semibold transition-colors cursor-pointer"
                                >
                                  {ui("Cancel")}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setApiKeyError(null);
                                  setConfirmRevokeKeyId(k.id);
                                }}
                                className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                              >
                                {ui("Revoke")}</button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="p-3 bg-neutral-900 text-neutral-200 rounded-xl space-y-1 text-xs font-mono">
                      <span className="text-neutral-400 text-[10px] uppercase font-bold tracking-wider block">{ui("Sample API Request")}</span>
                      <p className="text-[11px] select-all overflow-x-auto whitespace-nowrap">
                        curl https://liinx.app/api/v1/profile \<br />
                        {'  -H "Authorization: Bearer liinx_live_your_key_here"'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Instagram Caption Auto-Sync Card */}
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
                      <Instagram className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                        <span>{ui("Instagram Caption Auto-Sync")}</span>
                      </h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {ui("Automatically pull and create link buttons whenever you mention links in post captions.")}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border ${
                    instagramStatus?.connected
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                  }`}>
                    {instagramStatus?.connected ? ui("CONNECTED") : ui("DISCONNECTED")}
                  </span>
                </div>

                {/* Feedback Notification */}
                {instagramFeedback && (
                  <div className={`p-3 rounded-xl text-xs flex items-center justify-between animate-fade-in ${
                    instagramFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    <span>{instagramFeedback.message}</span>
                    <button 
                      onClick={() => setInstagramFeedback(null)}
                      className="font-bold text-xs opacity-70 hover:opacity-100 cursor-pointer ml-2"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Connection Details or Connect Button */}
                {instagramStatus?.connected ? (
                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900">@{instagramStatus.username}</span>
                        <span className="text-neutral-400">•</span>
                        <span className="font-mono text-neutral-500">
                          {instagramStatus.syncedLinksCount ?? 0} {ui("synced links active")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSyncInstagramNow}
                          disabled={isSyncingInstagram}
                          className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white font-semibold flex items-center gap-1.5 text-xs hover:bg-black transition-colors cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncingInstagram ? 'animate-spin' : ''}`} />
                          <span>{isSyncingInstagram ? ui("Syncing...") : ui("Sync Now")}</span>
                        </button>
                        <button
                          onClick={handleDisconnectInstagram}
                          className="px-3 py-1.5 rounded-lg border border-neutral-300 text-neutral-700 font-semibold text-xs hover:bg-neutral-100 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                        >
                          {ui("Disconnect")}</button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-xs">
                      <span className="text-neutral-600">{ui("Auto-sync on incoming Webhooks:")}</span>
                      <button
                        onClick={handleToggleInstagramAutoSync}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                          instagramStatus.autoSyncEnabled
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        {instagramStatus.autoSyncEnabled ? ui("ENABLED") : ui("PAUSED")}
                      </button>
                    </div>
                  </div>
                ) : !instagramStatus?.configured ? (
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 font-semibold">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{ui("Meta Instagram OAuth Setup Required")}</span>
                    </div>
                    <p className="text-amber-800 text-[11px] leading-relaxed">
                      {ui("To connect your live Instagram account, server administrators must configure")}<code className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[10px]">{ui("INSTAGRAM_CLIENT_ID")}</code> {ui("and")}<code className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[10px]">{ui("INSTAGRAM_CLIENT_SECRET")}</code> {ui("in the server environment.")}</p>
                    <div className="pt-1 flex items-center justify-between text-[11px] text-amber-900 font-medium">
                      <span>{ui("Live Caption Parser & Link Ingest is available below without OAuth.")}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-neutral-900">{ui("Connect your Instagram account")}</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {ui("Authorize via official Meta Graph API to enable automatic post polling & real-time webhook updates.")}</p>
                      </div>
                      <button
                        onClick={handleConnectInstagram}
                        className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                      >
                        <Instagram className="w-3.5 h-3.5" />
                        <span>{ui("Connect Account")}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Instant Caption Ingest & Parser Tester */}
                <div className="pt-2 border-t border-neutral-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>{ui("Live Caption Parser & Post Ingest")}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setInstagramCaptionInput('Tickets for Berlin studio show live now: https://eventbrite.com/e/berlin-live-2025! Also grab the vinyl bundle at https://shop.artist.studio/vinyl.')}
                      className="text-[10px] font-mono text-amber-700 hover:underline cursor-pointer"
                    >
                      {ui("Fill sample caption")}</button>
                  </div>
                  <textarea aria-label={ui("Destination URL")}
                    rows={2}
                    value={instagramCaptionInput}
                    onChange={(e) => setInstagramCaptionInput(e.target.value)}
                    placeholder={ui("Paste any Instagram caption containing links to extract & add to your bio (e.g. 'Presave the single on Spotify: https://...')")}
                    className="w-full text-xs p-3 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-neutral-50 focus:border-neutral-900 outline-none transition-colors"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleTestCaptionExtract(false)}
                      disabled={isTestingCaption || !instagramCaptionInput.trim()}
                      className="px-3 py-1.5 rounded-lg border border-neutral-300 hover:border-neutral-900 text-xs font-semibold text-neutral-700 transition-colors cursor-pointer disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                    >
                      {ui("Test Parser")}</button>
                    <button
                      type="button"
                      onClick={() => handleTestCaptionExtract(true)}
                      disabled={isTestingCaption || !instagramCaptionInput.trim()}
                      className="px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                    >
                      <span>{ui("Extract & Add Link to Bio")}</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Newsletter Subscribers Card with CSV Export */}
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900">{ui("Newsletter Email Subscribers")}</h3>
                    <p className="text-xs text-[#71717A] mt-0.5">
                      {ui("Real subscribers collected directly from your page's newsletter blocks.")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-black text-white text-xs font-mono font-bold rounded-xl">
                      {subscribers.length} {ui("total")}</span>
                    <button
                      onClick={handleExportCsv}
                      disabled={subscribers.length === 0}
                      className="px-3 py-1 rounded-xl border border-neutral-300 hover:border-black text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                      title={ui("Download CSV")}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{ui("Export CSV")}</span>
                    </button>
                  </div>
                </div>

                {subscribers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-400 border border-dashed rounded-xl">
                    {ui("No subscribers collected yet. Add a Newsletter block to your page to start capturing leads!")}</div>
                ) : (
                  <div className="divide-y divide-neutral-100 border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    {subscribers.map(sub => (
                      <div key={sub.id} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-neutral-50">
                        <span className="font-semibold text-neutral-800 break-all">{sub.email}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-neutral-400 text-[11px]">{sub.subscribedAt}</span>
                          <button type="button" onClick={() => handleDeleteSubscriber(sub.id)} aria-label={ui('Remove subscriber')} title={ui('Remove subscriber')} className="p-1.5 min-h-0 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Right Phone Live Preview Simulator (5 cols) */}
        <div className="studio-preview lg:col-span-5 sticky top-28 flex flex-col items-center">
          {/* Responsive Viewport Switcher */}
          <div className="flex items-center gap-1 mb-3 p-1 bg-neutral-100 rounded-full border border-neutral-200 text-xs shadow-xs">
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                previewDevice === 'mobile' ? 'bg-neutral-50 shadow-xs text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
                <span className="preview-label">{ui("Mobile")}</span>
            </button>
            <button
              onClick={() => setPreviewDevice('tablet')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                previewDevice === 'tablet' ? 'bg-neutral-50 shadow-xs text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
                <span className="preview-label">{ui("Tablet")}</span>
            </button>
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                previewDevice === 'desktop' ? 'bg-neutral-50 shadow-xs text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
                <span className="preview-label">{ui("Desktop")}</span>
            </button>
          </div>

          <ViewportPreview
            profile={{ ...profile, blocks: visibleBlocks, pages: activePage ? [activePage] : profile.pages, page: activePage }}
            customTheme={customTheme}
            deviceMode={previewDevice}
          />
        </div>

      </div>

      <QrCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        username={profile.username}
        displayName={profile.displayName}
      />

      <LinktreeImporterModal
        isOpen={showImporterModal}
        onClose={() => setShowImporterModal(false)}
        onImportComplete={async () => {
          try {
            const liveProfile = await api.studio.getProfile();
            setProfile(liveProfile);
            if (!liveProfile.pages?.some(item => item.id === activePageId)) setActivePageId(initialPageId(liveProfile));
            const th = resolveTheme(liveProfile.themeId, liveProfile.customTheme);
            setCustomTheme(th);
          } catch (err) {
            console.error('Failed to reload profile after import', err);
          }
        }}
      />

      <Modal open={Boolean(deletePageId)} onClose={() => setDeletePageId(null)} label={ui('Confirm page deletion')}>
        <div className="space-y-4 bg-white p-6 text-neutral-900">
          <div>
            <h2 className="text-base font-bold">{ui('Delete this page?')}</h2>
            <p className="mt-2 text-sm text-neutral-600">{ui('This page will be deleted. Its blocks will move to Home in their current order and will not be deleted.')}</p>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDeletePageId(null)} className="rounded-xl border border-neutral-300 px-4 py-2 text-xs font-semibold">{ui('Cancel')}</button>
            <button type="button" onClick={() => deletePageId && void handleDeletePage(deletePageId)} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white">{ui('Delete page')}</button>
          </div>
        </div>
      </Modal>

      {/* New Profile Creation Modal */}
      {showNewProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-neutral-900">{ui("Create New Bio Profile")}</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {ui("Add another project, brand, or persona under your account.")}</p>
              </div>
              <button
                onClick={() => setShowNewProfileModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {createProfileError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {createProfileError}
              </div>
            )}

            <form onSubmit={handleCreateProfileSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-800">{ui("Handle (Username)")}</label>
                <div className="flex items-center rounded-xl border border-neutral-200 bg-neutral-50 px-3 focus-within:bg-neutral-50 focus-within:border-neutral-900">
                  <span className="text-xs font-mono text-neutral-400">@</span>
                  <input aria-label={ui("Handle (Username)")}
                    type="text"
                    required
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder={ui("myotherbrand")}
                    className="w-full text-xs font-mono p-2 bg-transparent outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-800">{ui("Display Name")}</label>
                <input aria-label={ui("Display Name")}
                  type="text"
                  required
                  value={newDisplayName}
                  onChange={e => setNewDisplayName(e.target.value)}
                  placeholder={ui("My Other Brand")}
                  className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-neutral-50 focus:border-neutral-900 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewProfileModal(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-xs font-semibold text-neutral-700 cursor-pointer"
                >
                  {ui("Cancel")}</button>
                <button
                  type="submit"
                  disabled={isCreatingProfile || !newUsername.trim() || !newDisplayName.trim()}
                  className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isCreatingProfile ? ui("Creating...") : ui("Create Profile")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate API Key Modal (Milestone 8) */}
      {showNewKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-50 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-neutral-900">
                  {createdApiKey ? ui("API Key Generated") : ui("Generate Studio API Key")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowNewKeyModal(false);
                  setCreatedApiKey(null);
                  setNewKeyName('');
                  setCopiedKey(false);
                }}
                className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdApiKey ? (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    <strong>{ui("Make sure to copy your API key now.")}</strong> {ui("You won't be able to see it again! Store it in an environment variable or secrets manager.")}</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-800">{ui("Your Live Secret Key")}</label>
                  <div className="flex items-center gap-2">
                    <input aria-label={ui("Your Live Secret Key")}
                      type="text"
                      readOnly
                      value={createdApiKey}
                      className="w-full text-xs font-mono p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 select-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(createdApiKey);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey ? ui("Copied") : ui("Copy")}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewKeyModal(false);
                      setCreatedApiKey(null);
                      setNewKeyName('');
                      setCopiedKey(false);
                    }}
                    className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold cursor-pointer"
                  >
                    {ui("Done")}</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGenerateApiKeySubmit} className="space-y-4">
                {generateKeyError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                    {generateKeyError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-800">{ui("Key Name / Description")}</label>
                  <input aria-label={ui("Key Name / Description")}
                    type="text"
                    required
                    value={newKeyName}
                    onChange={e => setNewKeyName(e.target.value)}
                    placeholder={ui("e.g., Zapier Sync, Mobile App Integration")}
                    className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-neutral-50 focus:border-neutral-900 outline-none"
                  />
                  <p className="text-[11px] text-neutral-400">
                    {ui("Give your API key a recognizable name so you can track where it is being used.")}</p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewKeyModal(false)}
                    className="px-4 py-2 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-xs font-semibold text-neutral-700 cursor-pointer"
                  >
                    {ui("Cancel")}</button>
                  <button
                    type="submit"
                    disabled={isGeneratingKey || !newKeyName.trim()}
                    className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingKey ? ui("Generating...") : ui("Generate Key")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
