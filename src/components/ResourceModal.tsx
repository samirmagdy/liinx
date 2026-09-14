import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  Lock, 
  Globe2, 
  ArrowRightLeft, 
  BookOpen, 
  Palette, 
  Terminal, 
  Mail, 
  Check, 
  Copy, 
  ExternalLink,
  Server,
  Code
} from 'lucide-react';

export type ResourceDocType = 
  | 'privacy'
  | 'terms'
  | 'security'
  | 'dns-guide'
  | 'switch-linktree'
  | 'creator-handbook'
  | 'brand-assets'
  | 'api-docs'
  | 'support';

interface ResourceModalProps {
  isOpen: boolean;
  initialDoc: ResourceDocType;
  onClose: () => void;
  onNavigate?: (view: 'home' | 'builder' | 'templates' | 'pricing') => void;
}

const NAV_ITEMS: { id: ResourceDocType; label: string; icon: React.ComponentType<{ className?: string }>; category: string }[] = [
  { id: 'privacy', label: 'Privacy Policy', icon: FileText, category: 'Legal & Trust' },
  { id: 'terms', label: 'Terms of Service', icon: FileText, category: 'Legal & Trust' },
  { id: 'security', label: 'Security & GDPR', icon: Lock, category: 'Legal & Trust' },
  { id: 'support', label: 'Contact Support', icon: Mail, category: 'Legal & Trust' },
  { id: 'dns-guide', label: 'DNS & CNAME Setup', icon: Globe2, category: 'Resources & Docs' },
  { id: 'switch-linktree', label: 'Switching from Linktree', icon: ArrowRightLeft, category: 'Resources & Docs' },
  { id: 'creator-handbook', label: 'Creator Handbook', icon: BookOpen, category: 'Resources & Docs' },
  { id: 'brand-assets', label: 'Brand Assets & Logos', icon: Palette, category: 'Resources & Docs' },
  { id: 'api-docs', label: 'Public REST API', icon: Terminal, category: 'Resources & Docs' },
];

export const ResourceModal: React.FC<ResourceModalProps> = ({
  isOpen,
  initialDoc,
  onClose,
  onNavigate
}) => {
  const [activeDoc, setActiveDoc] = useState<ResourceDocType>(initialDoc);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    setActiveDoc(initialDoc);
  }, [initialDoc]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="resource-modal-dialog bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-neutral-100 flex flex-col max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#111315] text-white flex items-center justify-center font-bold">
              <div className="flex items-center gap-0.5">
                <span className="w-1 h-3 bg-white rounded-full" />
                <span className="w-1 h-2 bg-amber-400 rounded-full" />
                <span className="w-1 h-3 bg-white rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-neutral-900">LIINX Documentation & Legal</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live Production Docs
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">Official policies, setup instructions, and technical references</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-neutral-200 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Sidebar + Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-neutral-100 p-3 bg-neutral-50/40 shrink-0 overflow-y-auto max-h-48 md:max-h-none">
            <div className="space-y-4">
              {['Resources & Docs', 'Legal & Trust'].map(category => (
                <div key={category} className="space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 px-2.5 block">
                    {category}
                  </span>
                  <div className="space-y-0.5">
                    {NAV_ITEMS.filter(item => item.category === category).map(item => {
                      const Icon = item.icon;
                      const isActive = activeDoc === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveDoc(item.id)}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer ${
                            isActive
                              ? 'bg-neutral-900 text-white font-semibold shadow-xs'
                              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-neutral-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Document Content View */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto text-neutral-700 leading-relaxed text-xs sm:text-sm">
            
            {/* PRIVACY POLICY */}
            {activeDoc === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 font-brand">Privacy Policy</h2>
                  <p className="text-xs text-neutral-400 mt-1">Effective Date: January 1, 2026 • Version 2.4 (GDPR / CCPA Compliant)</p>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Zero Tracking Cookies Policy</span>
                  </div>
                  <p className="leading-normal">
                    LIINX is engineered with privacy as a foundational principle. We do not place persistent tracking cookies on public visitors, nor do we sell or monetize visitor browsing profiles.
                  </p>
                </div>

                <section className="space-y-2">
                  <h3 className="font-bold text-neutral-900 text-sm">1. Information We Collect</h3>
                  <p>
                    When you register an account or operate a bio profile on LIINX, we collect:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2 text-neutral-600">
                    <li><strong>Account Credentials:</strong> Email address and cryptographically hashed passwords.</li>
                    <li><strong>Profile Configuration:</strong> Custom bio, display name, handle username, links, custom styling (CSS and Google Font URLs).</li>
                    <li><strong>Connected Platforms:</strong> Encrypted Instagram Graph API OAuth tokens if you opt into Instagram Auto-Sync.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-neutral-900 text-sm">2. Cookie-Free Public Bio Analytics</h3>
                  <p>
                    When visitors view a creator bio or click an external link block:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2 text-neutral-600">
                    <li>We log aggregate click counts, timestamp, referring domain, and device family (mobile vs. desktop).</li>
                    <li>If marketing tags are included in the inbound URL (e.g. <code className="bg-neutral-100 px-1 py-0.5 rounded font-mono text-xs">utm_source</code>, <code className="bg-neutral-100 px-1 py-0.5 rounded font-mono text-xs">utm_campaign</code>), we record these strictly for creator campaign attribution.</li>
                    <li>We <strong>do not</strong> store raw IP addresses or cross-site tracking identifiers.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-neutral-900 text-sm">3. Optional Third-Party Retargeting Pixels</h3>
                  <p>
                    Creators on Pro or Studio tiers may optionally inject their own Google Analytics 4 (GA4) Measurement ID or Meta Pixel ID into their bio page. When enabled by the creator, the respective vendor script is loaded directly in the visitor’s browser. The creator is solely responsible for obtaining any necessary visitor consents in jurisdictions requiring prior opt-in.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-neutral-900 text-sm">4. Data Subject Rights (GDPR & CCPA)</h3>
                  <p>
                    Under the General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA), you have the right to inspect, export, or permanently erase your personal data. To trigger immediate deletion of your account and all associated profile records, email <a href="mailto:privacy@liinx.app" className="text-neutral-900 underline font-medium">privacy@liinx.app</a>.
                  </p>
                </section>
              </div>
            )}

            {/* TERMS OF SERVICE */}
            {activeDoc === 'terms' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 font-brand">Terms of Service</h2>
                  <p className="text-xs text-neutral-400 mt-1">Last Updated: January 1, 2026</p>
                </div>

                <section className="space-y-2">
                  <h3 className="font-bold text-neutral-900 text-sm">1. Acceptance of Terms</h3>
                  <p>
                    By creating an account, hosting links, or interacting with LIINX services, you agree to comply with and be bound by these Terms of Service. If you do not agree, you must discontinue use of the platform immediately.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-neutral-900 text-sm">2. 100% Creator Ownership</h3>
                  <p>
                    You retain 100% intellectual property ownership over all content, logos, artwork, audio embeds, trademarks, and links published through your LIINX bio. LIINX claims zero ownership over your brand assets.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-neutral-900 text-sm">3. Acceptable Use Policy</h3>
                  <p>
                    You agree not to use LIINX to distribute:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2 text-neutral-600">
                    <li>Malicious software, viruses, or phishing campaigns.</li>
                    <li>Deceptive fraudulent investment schemes or spam networks.</li>
                    <li>Unlawful content or material that infringes upon third-party copyrights or trademarks.</li>
                  </ul>
                  <p className="text-xs text-neutral-500">
                    Violations will result in immediate profile suspension and domain blacklisting without prior warning.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-neutral-900 text-sm">4. Subscriptions & Tier Entitlements</h3>
                  <p>
                    LIINX offers Free, Pro ($9/mo), and Studio ($24/mo) subscriptions. You may upgrade, downgrade, or cancel your subscription at any time. Plan limits (such as profile counts: 1 for Free, 5 for Pro, 25 for Studio) are strictly enforced at the database layer.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-neutral-900 text-sm">5. Service Level & Disclaimers</h3>
                  <p>
                    LIINX aims for 99.9% platform availability across our global CDN infrastructure. Services are provided on an "as is" and "as available" basis without warranties of any kind.
                  </p>
                </section>
              </div>
            )}

            {/* SECURITY & GDPR */}
            {activeDoc === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 font-brand">Security & GDPR Architecture</h2>
                  <p className="text-xs text-neutral-400 mt-1">Enterprise-grade security specifications and privacy-by-design standards</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/60 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-neutral-900 text-xs">
                      <Lock className="w-4 h-4 text-emerald-600" />
                      <span>Hashed Credentials & Secret Keys</span>
                    </div>
                    <p className="text-xs text-neutral-600">
                      Passwords are encrypted using Argon2id/bcrypt. Studio API keys are hashed with SHA-256 before persistence so secret keys cannot be retrieved if intercepted.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/60 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-neutral-900 text-xs">
                      <Globe2 className="w-4 h-4 text-blue-600" />
                      <span>Zero-Cookie Compliance</span>
                    </div>
                    <p className="text-xs text-neutral-600">
                      Standard public bio visits do not require cookie consent banners because no persistent cross-site tracking cookies or fingerprinting mechanisms are deployed.
                    </p>
                  </div>
                </div>

                <section className="space-y-2">
                  <h3 className="font-bold text-neutral-900 text-sm">Data Isolation & Tenant Security</h3>
                  <p>
                    Every API request to mutate or retrieve creator configuration passes through strict JWT owner verification. Users cannot read or modify blocks, analytics, or custom domain mappings belonging to other accounts.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-neutral-900 text-sm">Automated Backups & Disaster Recovery</h3>
                  <p>
                    Database state is managed via WAL (Write-Ahead Logging) SQLite with hourly automated replication snapshots, ensuring rapid point-in-time recovery and zero data loss in the event of infrastructure disruption.
                  </p>
                </section>
              </div>
            )}

            {/* DNS & CNAME SETUP GUIDE */}
            {activeDoc === 'dns-guide' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 font-brand">DNS & CNAME Setup Guide</h2>
                  <p className="text-xs text-neutral-400 mt-1">Connect your custom domain (e.g., links.yourbrand.com) in 3 simple steps</p>
                </div>

                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
                  <span className="font-bold block">Target CNAME Record</span>
                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-amber-300 font-mono text-xs">
                    <span>cname.liinx.app</span>
                    <button
                      type="button"
                      onClick={() => handleCopy('cname.liinx.app', 'cname')}
                      className="text-amber-800 hover:text-amber-950 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      {copiedText === 'cname' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedText === 'cname' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                    <div className="space-y-1">
                      <h4 className="font-bold text-neutral-900 text-xs">Add a CNAME Record in Your DNS Registrar</h4>
                      <p className="text-neutral-600 text-xs">
                        Log into Cloudflare, GoDaddy, Namecheap, Google Domains, or Route 53. Navigate to your DNS Management page and add a new record:
                      </p>
                      <div className="p-3 bg-neutral-900 text-neutral-200 rounded-xl font-mono text-[11px] space-y-1">
                        <div><span className="text-neutral-500">Type:</span> CNAME</div>
                        <div><span className="text-neutral-500">Name / Host:</span> links <span className="text-neutral-400">(or bio, or @ if supported)</span></div>
                        <div><span className="text-neutral-500">Value / Points to:</span> cname.liinx.app</div>
                        <div><span className="text-neutral-500">TTL:</span> Automatic / 300 seconds</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                    <div className="space-y-1">
                      <h4 className="font-bold text-neutral-900 text-xs">Enter Your Domain in LIINX Studio</h4>
                      <p className="text-neutral-600 text-xs">
                        Open LIINX Studio &gt; Settings &gt; Custom Domain. Type your full hostname (e.g. <code className="bg-neutral-100 px-1 py-0.5 rounded font-mono">links.yourbrand.com</code>) and click <strong>Verify DNS</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                    <div className="space-y-1">
                      <h4 className="font-bold text-neutral-900 text-xs">Automatic SSL & Routing</h4>
                      <p className="text-neutral-600 text-xs">
                        Our server resolves the CNAME record in real-time. Once validated, SSL is provisioned automatically, and any visitor loading your custom domain is directly served your LIINX page.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SWITCHING FROM LINKTREE */}
            {activeDoc === 'switch-linktree' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 font-brand">Switching from Linktree</h2>
                  <p className="text-xs text-neutral-400 mt-1">Migrate all your links, avatars, and social icons in under 10 seconds</p>
                </div>

                <div className="p-4 bg-neutral-900 text-white rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                    <span>Native 1-Click Importer</span>
                  </div>
                  <p className="text-neutral-300 text-xs">
                    You don’t have to copy and paste links manually. LIINX includes a live crawler that extracts public Linktree, Beacons, and Bio.fm configurations directly into your profile.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                    <div className="space-y-1">
                      <h4 className="font-bold text-neutral-900 text-xs">Open the Importer in Studio</h4>
                      <p className="text-neutral-600 text-xs">
                        In your LIINX Studio header bar, click the <strong>Import Linktree</strong> button.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                    <div className="space-y-1">
                      <h4 className="font-bold text-neutral-900 text-xs">Paste Your Public Bio URL</h4>
                      <p className="text-neutral-600 text-xs">
                        Enter your link (e.g. <code className="bg-neutral-100 px-1 py-0.5 rounded font-mono">linktr.ee/yourusername</code>). Our server parses the profile tree securely.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                    <div className="space-y-1">
                      <h4 className="font-bold text-neutral-900 text-xs">Review & Apply</h4>
                      <p className="text-neutral-600 text-xs">
                        Select whether to import your avatar, bio text, and specific links. Click <strong>Import Blocks</strong> to commit immediately to your live profile.
                      </p>
                    </div>
                  </div>
                </div>

                {onNavigate && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigate('builder');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Open Studio & Start Import
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* CREATOR HANDBOOK */}
            {activeDoc === 'creator-handbook' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 font-brand">Creator Handbook</h2>
                  <p className="text-xs text-neutral-400 mt-1">Best practices for maximizing conversion and maintaining a clean bio aesthetic</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-1.5">
                    <h4 className="font-bold text-neutral-900 text-xs">1. The "Rule of 5" Above the Fold</h4>
                    <p className="text-neutral-600 text-xs">
                      Mobile visitors make decisions in less than 2.8 seconds. Keep your 3 to 5 highest-priority calls to action at the top of your bio. Group secondary links into collapsibles or folders.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-1.5">
                    <h4 className="font-bold text-neutral-900 text-xs">2. Leverage Time-Release Scheduling</h4>
                    <p className="text-neutral-600 text-xs">
                      For product drops, concert tickets, or podcast releases, use our built-in Link Scheduling. Set a precise start date and time; LIINX automatically publishes the link when your drop goes live.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-1.5">
                    <h4 className="font-bold text-neutral-900 text-xs">3. Native Audio & Video Embeds</h4>
                    <p className="text-neutral-600 text-xs">
                      Rather than forcing visitors to leave your page, embed Spotify playlists, SoundCloud tracks, or YouTube teasers directly in your bio with zero loading lag.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* BRAND ASSETS & LOGOS */}
            {activeDoc === 'brand-assets' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 font-brand">Brand Assets & Logos</h2>
                  <p className="text-xs text-neutral-400 mt-1">Official color tokens, typography guidelines, and vector logomarks</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/60 space-y-3">
                    <h4 className="font-bold text-neutral-900 text-xs">Official Palette</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-2.5 rounded-xl bg-[#111315] text-white space-y-1">
                        <span className="font-mono text-[10px] block text-neutral-400">Primary Dark</span>
                        <span className="font-bold text-xs">#111315</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-500 text-black space-y-1">
                        <span className="font-mono text-[10px] block text-neutral-900 font-semibold">Accent Amber</span>
                        <span className="font-bold text-xs">#F59E0B</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-neutral-200 text-neutral-900 space-y-1">
                        <span className="font-mono text-[10px] block text-neutral-400">Pure White</span>
                        <span className="font-bold text-xs">#FFFFFF</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-neutral-900 text-white space-y-1">
                        <span className="font-mono text-[10px] block text-neutral-400">Neutral 900</span>
                        <span className="font-bold text-xs">#171717</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-neutral-900 text-xs">Official Vector SVG Mark</h4>
                      <button
                        type="button"
                        onClick={() => {
                          const svg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" rx="8" fill="#111315"/><rect x="8" y="8" width="4" height="16" rx="2" fill="white"/><rect x="14" y="11" width="4" height="10" rx="2" fill="#F59E0B"/><rect x="20" y="8" width="4" height="16" rx="2" fill="white"/></svg>`;
                          handleCopy(svg, 'svg');
                        }}
                        className="text-xs font-semibold text-neutral-700 hover:text-black flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedText === 'svg' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedText === 'svg' ? 'SVG Copied' : 'Copy SVG'}</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-neutral-100 rounded-xl">
                      <div className="w-12 h-12 rounded-xl bg-[#111315] flex items-center justify-center">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-6 bg-white rounded-full" />
                          <span className="w-1.5 h-4 bg-amber-400 rounded-full" />
                          <span className="w-1.5 h-6 bg-white rounded-full" />
                        </div>
                      </div>
                      <div className="text-xs text-neutral-600">
                        <span className="font-bold text-neutral-900 block">LIINX Triple-Bar Mark</span>
                        <span>Designed on a 4px grid system with proportional pill radius.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PUBLIC REST API DOCS */}
            {activeDoc === 'api-docs' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 font-brand">Public REST API (v1)</h2>
                  <p className="text-xs text-neutral-400 mt-1">Programmatically manage blocks, retrieve profile data, and trigger syncs</p>
                </div>

                <div className="p-3 bg-neutral-900 text-neutral-200 rounded-xl space-y-1.5 font-mono text-xs">
                  <span className="text-neutral-400 text-[10px] uppercase font-bold tracking-wider block">Base Endpoint</span>
                  <p className="text-emerald-400 font-semibold">https://liinx.app/api/v1</p>
                  <p className="text-[11px] text-neutral-400">
                    Header: <code className="text-neutral-200">Authorization: Bearer liinx_live_your_secret_key</code>
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-neutral-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">GET</span>
                      <code className="font-mono text-xs font-bold text-neutral-900">/profile</code>
                    </div>
                    <p className="text-xs text-neutral-600">
                      Returns full profile configuration, current theme, and list of all active blocks.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-neutral-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">POST</span>
                      <code className="font-mono text-xs font-bold text-neutral-900">/blocks</code>
                    </div>
                    <p className="text-xs text-neutral-600">
                      Create a new link or embed block programmatically (e.g. from Zapier, GitHub Actions, or custom script).
                    </p>
                    <div className="p-3 bg-neutral-950 text-neutral-200 rounded-xl font-mono text-[11px] overflow-x-auto">
                      <pre>{`{
  "type": "link",
  "title": "New Release",
  "url": "https://example.com/drop"
}`}</pre>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-neutral-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">DELETE</span>
                      <code className="font-mono text-xs font-bold text-neutral-900">/blocks/:id</code>
                    </div>
                    <p className="text-xs text-neutral-600">
                      Permanently removes a block by ID.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-neutral-500">
                  API Keys can be generated inside LIINX Studio &gt; Settings &gt; REST API Keys (available on the Studio plan).
                </p>
              </div>
            )}

            {/* CONTACT SUPPORT */}
            {activeDoc === 'support' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 font-brand">Contact Support & Engineering</h2>
                  <p className="text-xs text-neutral-400 mt-1">Direct access to the core engineering and design team</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-2">
                    <span className="text-xs font-bold text-neutral-900 block">Creator & Technical Support</span>
                    <p className="text-xs text-neutral-600 leading-normal">
                      For DNS assistance, billing questions, or profile troubleshooting:
                    </p>
                    <a 
                      href="mailto:support@liinx.app" 
                      className="inline-flex items-center gap-1.5 font-bold text-xs text-neutral-900 hover:text-amber-600 underline"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>support@liinx.app</span>
                    </a>
                  </div>

                  <div className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-2">
                    <span className="text-xs font-bold text-neutral-900 block">Enterprise & Custom Work</span>
                    <p className="text-xs text-neutral-600 leading-normal">
                      For agency multi-account deployments, custom font licensing, or API limits:
                    </p>
                    <a 
                      href="mailto:founders@liinx.app" 
                      className="inline-flex items-center gap-1.5 font-bold text-xs text-neutral-900 hover:text-amber-600 underline"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>founders@liinx.app</span>
                    </a>
                  </div>
                </div>

                <div className="p-4 bg-neutral-100 rounded-2xl text-xs text-neutral-600 space-y-1">
                  <span className="font-bold text-neutral-900 block">Service Level Targets</span>
                  <p>• Studio Plan: Response within 4 hours (24/7 priority dispatch)</p>
                  <p>• Pro Plan: Response within 24 hours</p>
                  <p>• Free Plan: Response within 48 business hours</p>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-100 bg-neutral-50/70 flex items-center justify-between text-xs text-neutral-500 shrink-0">
          <span>LIINX Studio Inc. • Global Privacy & Security Framework</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
