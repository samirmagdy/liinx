import { useLanguage as useUiLanguage } from '../context/LanguageContext';
import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { brand } from '../config/brand';
import { THEMES } from '../data/mockData';
import confetti from 'canvas-confetti';
import { 
  ArrowRight, 
  ArrowLeft,
  Lock, 
  Mail, 
  AtSign, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Sparkles,
  Camera,
  Music,
  Code,
  Heart,
  Briefcase,
  User,
  Palette,
  Check
} from 'lucide-react';

const INTENT_OPTIONS = [
  { id: 'creator', label: 'Creator / Influencer', icon: Sparkles, defaultCategory: 'Creator' },
  { id: 'photographer', label: 'Photographer / Visual Artist', icon: Camera, defaultCategory: 'Design & Art' },
  { id: 'musician', label: 'Musician / Producer / DJ', icon: Music, defaultCategory: 'Musicians' },
  { id: 'developer', label: 'Developer / Designer / Studio', icon: Code, defaultCategory: 'Tech & Design' },
  { id: 'coach', label: 'Coach / Consultant / Wellness', icon: Heart, defaultCategory: 'Wellness' },
  { id: 'business', label: 'Small Business / Brand', icon: Briefcase, defaultCategory: 'Business' }
];

export const RegisterPage: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedIntent, setSelectedIntent] = useState('creator');
  const [selectedThemeId, setSelectedThemeId] = useState('editorial-stone');
  const [availability, setAvailability] = useState<{ checked: boolean; available: boolean; message?: string }>({
    checked: false,
    available: false
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const [, setLocation] = useLocation();

  // Read initial handle from query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialHandle = params.get('username');
    const template = params.get('template');
    if (template && THEMES.some(theme => theme.id === template)) setSelectedThemeId(template);
    if (initialHandle) {
      const clean = initialHandle.toLowerCase().replace(/[^a-z0-9_]/g, '');
      setUsername(clean);
    }
  }, []);

  // Debounced username check
  useEffect(() => {
    let active = true;
    if (!username || username.length < 3) {
      setAvailability({ checked: false, available: false });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.auth.checkUsername(username);
        if (!active) return;
        setAvailability({ checked: true, available: res.available, message: res.reason });
      } catch {
        setAvailability({ checked: false, available: false });
      }
    }, 250);

    return () => { active = false; clearTimeout(timer); };
  }, [username]);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (availability.checked && !availability.available) {
      setError(availability.message || 'This username is not available.');
      return;
    }

    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register(email, password, username);
      
      // Update profile with selected theme and intent
      const category = INTENT_OPTIONS.find(i => i.id === selectedIntent)?.defaultCategory || 'Creator';
      try {
        await api.studio.updateProfile({
          themeId: selectedThemeId,
          category
        });
      } catch {}

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
      const params = new URLSearchParams(window.location.search);
      const plan = params.get('plan');
      if (params.get('after') === 'import') {
        setLocation('/studio?import=1');
      } else if (plan === 'pro' || plan === 'studio') {
        setLocation(`/pricing?plan=${plan}&interval=${params.get('interval') === 'year' ? 'year' : 'month'}`);
      } else setLocation('/studio');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      setStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 rounded-lg">
          <div className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            {brand.logoMark}
          </div>
          <span className="font-bold text-xl tracking-tight text-neutral-900">{brand.productShortName}</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
          {step === 1 ? ui("Build your micro-site") : ui("Choose your aesthetic")}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-neutral-600">
          {step === 1 ? (
            <>
              {ui("Already have an account?")}{' '}
              <Link href="/login" className="font-semibold text-neutral-900 hover:underline">
                {ui("Sign in here")}</Link>
            </>
          ) : (
            ui('Step 2 of 2: Select your focus discipline and initial theme.')
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-neutral-50/70 py-8 px-6 shadow-sm rounded-3xl border border-neutral-200 sm:px-10">
          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <form className="space-y-4" onSubmit={handleNextStep}>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  {ui("Choose your handle")}</label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                  <input aria-label={ui("Choose your handle")}
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder={ui("yourname")}
                    className="w-full pl-10 pr-10 py-2.5 bg-white rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 transition-colors"
                  />
                  {availability.checked && (
                    <div className="absolute right-3.5 top-3">
                      {availability.available ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      )}
                    </div>
                  )}
                </div>
                <p className="mt-1.5 text-[11px] text-neutral-500">
                  {ui("Your live link will be")}<span className="font-mono text-neutral-700 font-semibold">{brand.domain}/@{username || 'yourname'}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  {ui("Email address")}</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    aria-label={ui('Email address')} name="email" autoComplete="email" dir="ltr"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  {ui("Choose password")}</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    aria-label={ui('Choose password')} name="password" autoComplete="new-password" minLength={8} maxLength={128}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={ui("At least 8 characters")}
                    className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={availability.checked && !availability.available}
                className="w-full mt-3 py-3 px-4 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
              >
                <span>{ui("Continue to Step 2")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleFinalSubmit}>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-2">
                  {ui("What are you building?")}</label>
                <div className="grid grid-cols-2 gap-2">
                  {INTENT_OPTIONS.map((item) => {
                    const Icon = item.icon;
                    const isSelected = selectedIntent === item.id;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setSelectedIntent(item.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white border-neutral-900 ring-1 ring-neutral-900 text-neutral-950'
                            : 'bg-white/60 border-neutral-200 text-neutral-600 hover:border-neutral-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-amber-600' : 'text-neutral-400'}`} />
                        <span className="text-[11px] font-semibold leading-tight">{ui(item.label)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-2">
                  {ui("Choose starting design theme")}</label>
                <div className="grid grid-cols-3 gap-2">
                  {THEMES.slice(0, 6).map((theme) => {
                    const isSelected = selectedThemeId === theme.id;
                    return (
                      <button
                        type="button"
                        key={theme.id}
                        onClick={() => setSelectedThemeId(theme.id)}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-white border-neutral-900 ring-2 ring-neutral-900 text-neutral-900 shadow-xs'
                            : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-600'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full border shadow-xs"
                          style={{ backgroundColor: theme.bgColor, borderColor: theme.isDark ? '#444' : '#ccc' }}
                        />
                        <span className="text-[10px] font-semibold truncate w-full">{theme.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-3.5 py-3 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="px-3.5 py-3 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {ui('Skip for now')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{ui("Creating your Studio...")}</span>
                    </>
                  ) : (
                    <>
                      <span>{ui("Launch My Micro-Site")}</span>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
