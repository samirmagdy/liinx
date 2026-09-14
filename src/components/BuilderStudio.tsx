import React, { useState, useEffect, useRef } from 'react';
import { CreatorProfile, ThemeConfig, ProfileBlock, LinkBlock, FolderBlock, AudioBlock, VideoBlock, NewsletterBlock, SocialLink } from '../types';
import { DEMO_PROFILES, THEMES } from '../data/mockData';
import { PhonePreview } from './PhonePreview';
import { QrCodeModal } from './QrCodeModal';
import { api } from '../services/api';
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
  Link as LinkIcon, 
  Sliders, 
  RotateCcw,
  Smartphone,
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
  Disc
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BuilderStudioProps {
  initialProfile?: CreatorProfile;
  onViewFullscreen: (profile: CreatorProfile, theme: ThemeConfig) => void;
}

export const BuilderStudio: React.FC<BuilderStudioProps> = ({
  initialProfile,
  onViewFullscreen
}) => {
  const [profile, setProfile] = useState<CreatorProfile>(initialProfile || DEMO_PROFILES[0]);
  const [activeTab, setActiveTab] = useState<'content' | 'appearance' | 'settings' | 'analytics'>('content');
  const [customTheme, setCustomTheme] = useState<ThemeConfig>(
    profile.customTheme || THEMES.find(t => t.id === profile.themeId) || THEMES[0]
  );
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [showAddMenu, setShowAddMenu] = useState(false);
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

  // Load live profile on initial mount
  useEffect(() => {
    api.studio.getProfile()
      .then(liveProfile => {
        setProfile(liveProfile);
        const th = liveProfile.customTheme || THEMES.find(t => t.id === liveProfile.themeId) || THEMES[0];
        setCustomTheme(th);
      })
      .catch(err => {
        console.log('Using active session profile:', err.message);
      });
  }, []);

  // Fetch real analytics when Analytics tab is opened
  useEffect(() => {
    if (activeTab === 'analytics') {
      api.studio.getAnalytics()
        .then(data => setAnalyticsData(data))
        .catch(err => console.error('Failed to load analytics:', err));
    } else if (activeTab === 'settings') {
      api.studio.getSubscribers()
        .then(res => setSubscribers(res.subscribers))
        .catch(err => console.error('Failed to load subscribers:', err));
    }
  }, [activeTab]);

  // Debounced auto-save to database
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerAutoSave = (updatedProfile: Partial<CreatorProfile>) => {
    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.studio.updateProfile({
          displayName: updatedProfile.displayName ?? profile.displayName,
          bio: updatedProfile.bio ?? profile.bio,
          avatarUrl: updatedProfile.avatarUrl ?? profile.avatarUrl,
          category: updatedProfile.category ?? profile.category,
          themeId: updatedProfile.themeId ?? profile.themeId,
          customTheme: updatedProfile.customTheme ?? customTheme,
          socials: updatedProfile.socials ?? profile.socials
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Auto-save error:', err);
        setSaveStatus('error');
      }
    }, 600);
  };

  const handleProfileChange = (field: keyof CreatorProfile, value: any) => {
    const updated = { ...profile, [field]: value };
    setProfile(updated);
    triggerAutoSave(updated);
  };

  // Avatar Image Upload
  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await api.studio.uploadImage(file);
      const updated = { ...profile, avatarUrl: res.url };
      setProfile(updated);
      triggerAutoSave(updated);
    } catch (err: any) {
      alert(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
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
    triggerAutoSave(updated);
    setNewSocialUrl('');
  };

  const handleRemoveSocial = (index: number) => {
    const currentSocials = profile.socials || [];
    const updatedSocials = currentSocials.filter((_, i) => i !== index);
    const updated = { ...profile, socials: updatedSocials };
    setProfile(updated);
    triggerAutoSave(updated);
  };

  // Plan Upgrade Operation
  const handleUpgradePlan = async (targetPlan: 'free' | 'pro' | 'studio') => {
    try {
      setSaveStatus('saving');
      const res = await api.studio.updatePlan(targetPlan);
      setProfile(prev => ({ ...prev, plan: targetPlan }));
      setSaveStatus('saved');
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
      alert(res.message);
    } catch (err: any) {
      alert(err.message || 'Failed to update plan');
      setSaveStatus('error');
    }
  };

  // Block Operations with Real Database Calls
  const handleAddLink = async () => {
    try {
      setSaveStatus('saving');
      const newBlock = await api.studio.createBlock({
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
      const newBlock = await api.studio.createBlock({
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
      const newBlock = await api.studio.createBlock({
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
      const newBlock = await api.studio.createBlock({
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
      const newBlock = await api.studio.createBlock({
        type: 'folder',
        title: 'Curated Resource Links',
        extra: {
          subtitle: 'Expandable collection of destinations',
          items: [
            { id: 'f_1', title: 'Main Project', url: 'https://github.com' },
            { id: 'f_2', title: 'Documentation', url: 'https://docs.liinx.co' }
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
      const newBlock = await api.studio.createBlock({
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

  const handleMoveBlock = async (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...profile.blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;
    setProfile(prev => ({ ...prev, blocks: newBlocks }));

    try {
      setSaveStatus('saving');
      await api.studio.reorderBlocks(newBlocks.map(b => b.id));
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const handleDeleteBlock = async (id: string) => {
    setProfile(prev => ({ ...prev, blocks: prev.blocks.filter(b => b.id !== id) }));
    try {
      setSaveStatus('saving');
      await api.studio.deleteBlock(id);
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const handleUpdateBlockField = (id: string, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === id ? { ...b, [field]: value } : b)
    }));

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveStatus('saving');
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.studio.updateBlock(id, { [field]: value });
        setSaveStatus('saved');
      } catch (err) {
        setSaveStatus('error');
      }
    }, 500);
  };

  const handleUpdateBlockExtra = (id: string, extraUpdates: Record<string, any>) => {
    setProfile(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === id ? { ...b, ...extraUpdates } : b)
    }));

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveStatus('saving');
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.studio.updateBlock(id, { extra: extraUpdates });
        setSaveStatus('saved');
      } catch (err) {
        setSaveStatus('error');
      }
    }, 500);
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

  const handleCopyPublicLink = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/@${profile.username}`);
    setCopiedLink(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.3 }
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleThemeSelect = (theme: ThemeConfig) => {
    setCustomTheme(theme);
    const updated = { ...profile, themeId: theme.id, customTheme: theme };
    setProfile(updated);
    triggerAutoSave(updated);
  };

  // Export CSV
  const handleExportCsv = () => {
    if (subscribers.length === 0) {
      alert('No subscribers to export.');
      return;
    }
    const headers = 'Email,Subscribed At\n';
    const rows = subscribers.map(s => `"${s.email}","${s.subscribedAt}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `liinx-${profile.username}-subscribers.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-[calc(100vh-72px)] bg-neutral-50 border-t border-neutral-200 flex flex-col">
      
      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Studio Top Control Bar */}
      <div className="bg-white border-b border-neutral-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-18 z-30 shadow-2xs">
        
        {/* Left: Username & Save Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500">Handle:</span>
            <span className="font-mono text-xs font-bold text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded-lg">
              @{profile.username}
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              {profile.plan || 'free'} TIER
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <span className={`w-2 h-2 rounded-full ${
              saveStatus === 'saving' ? 'bg-amber-500 animate-ping' : 
              saveStatus === 'error' ? 'bg-rose-500' : 'bg-emerald-500'
            }`} />
            <span className="font-mono text-[11px]">
              {saveStatus === 'saving' ? 'Saving to database...' : 
               saveStatus === 'error' ? 'Save failed' : 'Saved to database'}
            </span>
          </div>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQrModalOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:border-neutral-900 bg-white text-xs font-semibold text-neutral-900 flex items-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">QR Code</span>
          </button>

          <button
            onClick={handleCopyPublicLink}
            className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:border-neutral-900 bg-white text-xs font-semibold text-neutral-900 flex items-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copy Link</span>
              </>
            )}
          </button>

          <button
            onClick={() => onViewFullscreen(profile, customTheme)}
            className="px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95 shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
          >
            <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
            <span>View Live Page</span>
          </button>
        </div>

      </div>

      {/* Main Studio Workspace: Left Editor + Right Simulator */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Control Canvas (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Navigation Sub-Tabs */}
          <div className="flex items-center p-1 bg-white border border-neutral-200 rounded-2xl shadow-xs gap-1">
            <button
              onClick={() => setActiveTab('content')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${
                activeTab === 'content'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Blocks & Content</span>
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
              <span>Themes & Styles</span>
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
              <span>Real Analytics</span>
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
              <span>Settings & Plan</span>
            </button>
          </div>

          {/* TAB 1: CONTENT & PROFILE BLOCKS */}
          {activeTab === 'content' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Profile Bio & Avatar Card */}
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#18181B]">Creator Identity</h3>
                  <span className="text-[10px] font-mono uppercase bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-md">
                    Live Profile
                  </span>
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
                        <span>{uploadingImage ? 'Uploading...' : 'Upload Avatar Image'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Supports JPG, PNG, WEBP up to 5MB. Stored directly on server.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={profile.displayName}
                      onChange={(e) => handleProfileChange('displayName', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 font-semibold text-neutral-900 focus:ring-1 focus:ring-neutral-900/10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 mb-1">Category / Tag</label>
                    <input
                      type="text"
                      value={profile.category}
                      onChange={(e) => handleProfileChange('category', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900 focus:ring-1 focus:ring-neutral-900/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1">Short Bio</label>
                  <textarea
                    rows={2}
                    value={profile.bio}
                    onChange={(e) => handleProfileChange('bio', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900 resize-none focus:ring-1 focus:ring-neutral-900/10"
                  />
                </div>

                {/* Social Links Manager */}
                <div className="pt-3 border-t border-neutral-100">
                  <label className="block text-xs font-bold text-neutral-900 mb-2">Connected Social Icons</label>
                  
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
                            title="Remove social link"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-neutral-400">No social links added yet.</p>
                    )}
                  </div>

                  {/* Add social link form */}
                  <div className="flex items-center gap-2">
                    <select
                      value={newSocialPlatform}
                      onChange={(e) => setNewSocialPlatform(e.target.value as SocialLink['platform'])}
                      className="px-2.5 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold outline-none focus:border-neutral-900"
                    >
                      <option value="instagram">Instagram</option>
                      <option value="twitter">X / Twitter</option>
                      <option value="youtube">YouTube</option>
                      <option value="spotify">Spotify</option>
                      <option value="github">GitHub</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="email">Email</option>
                    </select>

                    <input
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
                      Add
                    </button>
                  </div>
                </div>

              </div>

              {/* Add New Block Bar */}
              <div className="relative">
                <button
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-neutral-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 focus-visible:ring-offset-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Link or Block to Profile</span>
                </button>

                {showAddMenu && (
                  <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white rounded-2xl border border-neutral-200 shadow-2xl z-20 grid grid-cols-2 sm:grid-cols-3 gap-2 animate-fade-in">
                    <button
                      onClick={handleAddLink}
                      className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 flex flex-col items-center text-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                    >
                      <LinkIcon className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-neutral-900">Custom Link</span>
                    </button>

                    <button
                      onClick={handleAddHeader}
                      className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 flex flex-col items-center text-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                    >
                      <Sliders className="w-4 h-4 text-neutral-700" />
                      <span className="text-xs font-bold text-neutral-900">Section Title</span>
                    </button>

                    <button
                      onClick={handleAddAudio}
                      className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 flex flex-col items-center text-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                    >
                      <Music className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-neutral-900">Audio Track</span>
                    </button>

                    <button
                      onClick={handleAddVideo}
                      className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 flex flex-col items-center text-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                    >
                      <Video className="w-4 h-4 text-red-600" />
                      <span className="text-xs font-bold text-neutral-900">Video Embed</span>
                    </button>

                    <button
                      onClick={handleAddFolder}
                      className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 flex flex-col items-center text-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                    >
                      <FolderPlus className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-neutral-900">Link Folder</span>
                    </button>

                    <button
                      onClick={handleAddNewsletter}
                      className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 flex flex-col items-center text-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                    >
                      <Mail className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-bold text-neutral-900">Newsletter</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Block List Draggable/Reorderable */}
              <div className="space-y-3">
                {profile.blocks.map((block, index) => (
                  <div 
                    key={block.id}
                    className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs space-y-3 hover:border-neutral-400 transition-colors"
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
                            <span>{(block as LinkBlock).clicks} clicks</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleMoveBlock(index, 'up')}
                          disabled={index === 0}
                          className="p-1 rounded-lg text-neutral-400 hover:text-black disabled:opacity-20 cursor-pointer"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveBlock(index, 'down')}
                          disabled={index === profile.blocks.length - 1}
                          className="p-1 rounded-lg text-neutral-400 hover:text-black disabled:opacity-20 cursor-pointer"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBlock(block.id)}
                          className="p-1 rounded-lg text-rose-400 hover:text-rose-600 cursor-pointer"
                          title="Delete block"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Form Fields per Block Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Title</label>
                        <input
                          type="text"
                          value={block.title}
                          onChange={(e) => handleUpdateBlockField(block.id, 'title', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900"
                        />
                      </div>

                      {block.type === 'link' && (
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Destination URL</label>
                          <input
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
                          <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Artist Name</label>
                          <input
                            type="text"
                            value={(block as AudioBlock).artist || ''}
                            onChange={(e) => handleUpdateBlockExtra(block.id, { artist: e.target.value })}
                            placeholder="Artist / Band"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900"
                          />
                        </div>
                      )}

                      {block.type === 'video' && (
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Video Stream URL</label>
                          <input
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
                          <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Button CTA Text</label>
                          <input
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Subtitle Note</label>
                          <input
                            type="text"
                            value={(block as LinkBlock).subtitle || ''}
                            onChange={(e) => handleUpdateBlockField(block.id, 'subtitle', e.target.value)}
                            placeholder="Supporting text..."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Badge Tag</label>
                          <input
                            type="text"
                            value={(block as LinkBlock).badge || ''}
                            onChange={(e) => handleUpdateBlockField(block.id, 'badge', e.target.value)}
                            placeholder="e.g. NEW, SALE, LISTEN"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900"
                          />
                        </div>
                      </div>
                    )}

                    {block.type === 'audio' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Album Cover Image URL</label>
                          <input
                            type="text"
                            value={(block as AudioBlock).coverUrl || ''}
                            onChange={(e) => handleUpdateBlockExtra(block.id, { coverUrl: e.target.value })}
                            placeholder="https://..."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 font-mono text-[11px] text-neutral-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Streaming Link</label>
                          <input
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
                        <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Thumbnail Preview Image URL</label>
                        <input
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
                        <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Newsletter Description</label>
                        <input
                          type="text"
                          value={(block as NewsletterBlock).description || ''}
                          onChange={(e) => handleUpdateBlockExtra(block.id, { description: e.target.value })}
                          placeholder="What will subscribers get?"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900"
                        />
                      </div>
                    )}

                    {block.type === 'folder' && (
                      <div className="space-y-2 pt-2 border-t border-neutral-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-neutral-700">Folder Links</span>
                          <button
                            type="button"
                            onClick={() => handleAddFolderItem(block.id)}
                            className="text-[11px] text-blue-600 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add Item
                          </button>
                        </div>
                        {((block as FolderBlock).items || []).map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => handleUpdateFolderItem(block.id, item.id, 'title', e.target.value)}
                              placeholder="Title"
                              className="w-1/3 px-2 py-1 rounded border border-neutral-200 text-[11px] bg-neutral-50 text-neutral-900"
                            />
                            <input
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
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-neutral-900">Curated Visual Presets</h3>
                <p className="text-xs text-neutral-500">
                  Choose from carefully crafted aesthetic profiles. Every palette is built with strong contrast and responsive tokens.
                </p>

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
                          <p className="text-[10px] text-neutral-500 font-mono capitalize">{th.fontFamily} font</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${th.isDark ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-900'}`}>
                        {th.isDark ? 'Dark' : 'Light'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Geometry & Radius Control */}
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-neutral-900">Card Geometry & Accent Tint</h3>
                
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
                      {rad === 'none' ? 'Square' : rad === 'full' ? 'Pill' : rad}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-[#71717A] mb-2">Brand Accent Color</label>
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
                <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
                  <span className="text-xs text-neutral-500">30-Day Views</span>
                  <p className="text-2xl font-extrabold text-neutral-900 mt-1 tabular-nums">
                    {analyticsData ? analyticsData.totalViews.toLocaleString() : '...'}
                  </p>
                  <span className="text-[10px] text-neutral-500 font-mono tabular-nums">
                    {analyticsData ? `${analyticsData.uniqueVisitors} unique` : 'loading'}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
                  <span className="text-xs text-neutral-500">Click-Through</span>
                  <p className="text-2xl font-extrabold text-emerald-600 mt-1 tabular-nums">
                    {analyticsData ? analyticsData.ctr : '...'}
                  </p>
                  <span className="text-[10px] text-emerald-700 font-semibold font-mono">Real conversion</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
                  <span className="text-xs text-neutral-500">Total Clicks</span>
                  <p className="text-2xl font-extrabold text-neutral-900 mt-1 tabular-nums">
                    {analyticsData ? analyticsData.totalClicks.toLocaleString() : '...'}
                  </p>
                  <span className="text-[10px] text-neutral-500 font-mono">Live logged</span>
                </div>
              </div>

              {/* 7-Day Daily Bar Chart */}
              {analyticsData && analyticsData.dailyTimeline && (
                <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span>7-Day Engagement Timeline</span>
                    </h4>
                    <div className="flex items-center gap-3 text-[10px] font-mono">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-neutral-200 rounded" /> Views</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded" /> Clicks</span>
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
                <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-neutral-900">Top Performing Links</h4>
                  {analyticsData.topLinks.length === 0 ? (
                    <p className="text-xs text-neutral-400 py-2">No clicks recorded yet. Share your link to start tracking!</p>
                  ) : (
                    <div className="space-y-2.5 text-xs">
                      {analyticsData.topLinks.map((link) => (
                        <div key={link.id} className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-semibold truncate max-w-xs">{link.title}</span>
                            <span className="font-mono text-neutral-500 tabular-nums">{link.clicks} clicks ({link.percentage}%)</span>
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
            </div>
          )}

          {/* TAB 4: SETTINGS, SUBSCRIBERS & PLAN */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Subscription Plan Card */}
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Membership & Subscription Plan</span>
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Current tier: <strong className="uppercase font-mono text-neutral-900">{profile.plan || 'free'}</strong>
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-neutral-100 text-neutral-800 text-xs font-mono font-bold rounded-xl border border-neutral-200">
                    ACTIVE
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className={`p-4 rounded-xl border text-xs flex flex-col justify-between transition-colors ${
                    (profile.plan || 'free') === 'free' ? 'border-neutral-900 ring-2 ring-neutral-900/10 bg-neutral-50' : 'border-neutral-200'
                  }`}>
                    <div>
                      <div className="font-bold text-sm text-neutral-900">Free</div>
                      <div className="text-neutral-500 text-[11px] mt-0.5">Core links, analytics & bio</div>
                    </div>
                    <button
                      onClick={() => handleUpgradePlan('free')}
                      disabled={(profile.plan || 'free') === 'free'}
                      className="mt-3 py-1.5 px-3 rounded-lg border border-neutral-300 text-center font-semibold disabled:opacity-50 cursor-pointer hover:border-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 transition-colors"
                    >
                      {(profile.plan || 'free') === 'free' ? 'Current Plan' : 'Downgrade'}
                    </button>
                  </div>

                  <div className={`p-4 rounded-xl border text-xs flex flex-col justify-between transition-colors ${
                    profile.plan === 'pro' ? 'border-neutral-900 ring-2 ring-neutral-900/10 bg-neutral-50' : 'border-neutral-200'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-neutral-900">Pro</span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-mono font-bold px-1.5 py-0.5 rounded">POPULAR</span>
                      </div>
                      <div className="text-neutral-500 text-[11px] mt-0.5">Custom domain, 0% branding, priority routing</div>
                    </div>
                    <button
                      onClick={() => handleUpgradePlan('pro')}
                      disabled={profile.plan === 'pro'}
                      className="mt-3 py-1.5 px-3 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 text-center font-semibold disabled:opacity-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 transition-colors"
                    >
                      {profile.plan === 'pro' ? 'Current Plan' : 'Select Pro'}
                    </button>
                  </div>

                  <div className={`p-4 rounded-xl border text-xs flex flex-col justify-between transition-colors ${
                    profile.plan === 'studio' ? 'border-neutral-900 ring-2 ring-neutral-900/10 bg-neutral-50' : 'border-neutral-200'
                  }`}>
                    <div>
                      <div className="font-bold text-sm text-neutral-900">Studio VIP</div>
                      <div className="text-neutral-500 text-[11px] mt-0.5">Custom CSS, team members, full API</div>
                    </div>
                    <button
                      onClick={() => handleUpgradePlan('studio')}
                      disabled={profile.plan === 'studio'}
                      className="mt-3 py-1.5 px-3 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 text-center font-semibold disabled:opacity-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 transition-colors"
                    >
                      {profile.plan === 'studio' ? 'Current Plan' : 'Select Studio'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Newsletter Subscribers Card with CSV Export */}
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900">Newsletter Email Subscribers</h3>
                    <p className="text-xs text-[#71717A] mt-0.5">
                      Real subscribers collected directly from your page's newsletter blocks.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-black text-white text-xs font-mono font-bold rounded-xl">
                      {subscribers.length} total
                    </span>
                    <button
                      onClick={handleExportCsv}
                      disabled={subscribers.length === 0}
                      className="px-3 py-1 rounded-xl border border-neutral-300 hover:border-black text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                      title="Download CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {subscribers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-400 border border-dashed rounded-xl">
                    No subscribers collected yet. Add a Newsletter block to your page to start capturing leads!
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100 border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    {subscribers.map(sub => (
                      <div key={sub.id} className="p-3 flex items-center justify-between text-xs hover:bg-neutral-50">
                        <span className="font-semibold text-neutral-800">{sub.email}</span>
                        <span className="font-mono text-neutral-400 text-[11px]">{sub.subscribedAt}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Right Phone Live Preview Simulator (5 cols) */}
        <div className="lg:col-span-5 sticky top-28 flex justify-center">
          <PhonePreview
            profile={profile}
            customTheme={customTheme}
          />
        </div>

      </div>

      <QrCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        username={profile.username}
        displayName={profile.displayName}
      />

    </div>
  );
};
