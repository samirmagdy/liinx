import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { brand } from '../config/brand';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Shield, Lock, FileText, Mail, Send, CheckCircle2, ArrowRight } from 'lucide-react';

export function PrivacyPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Navbar activeView="privacy" />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16">
        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700">
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-neutral-500">Last updated: September 2026 • Effective immediately</p>
        </div>

        <div className="prose prose-neutral max-w-none space-y-8 text-neutral-700 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-neutral-900">1. Our Core Privacy Philosophy</h2>
            <p>
              At {brand.productName} ({brand.legalName}), we believe your link-in-bio and micro-website should showcase your work — not harvest your visitors' personal data. We do not sell user data, we do not participate in cross-site tracking networks, and we collect only the minimal data required to render your profiles and compute aggregated analytics.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-neutral-900">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2 text-neutral-600">
              <li><strong>Account Credentials:</strong> Email address and cryptographically hashed passwords (using bcrypt with work factor 10). Plain-text passwords are never stored.</li>
              <li><strong>Profile Content:</strong> Display name, bio, social links, custom themes, and block definitions you configure in the Studio Builder.</li>
              <li><strong>Privacy-Preserving Analytics:</strong> Total views and link clicks. IP addresses are salted and hashed (one-way SHA-256) into anonymous identifiers. We never store raw visitor IP addresses.</li>
              <li><strong>Newsletter Subscribers:</strong> When visitors voluntarily subscribe to your newsletter block, their email is stored securely in your private subscriber list.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-neutral-900">3. Right to Erasure & Account Deletion</h2>
            <p>
              Under GDPR and international privacy regulations, you retain full ownership of your data. You may permanently delete your account and all associated profiles, blocks, subscriber lists, and click logs at any time directly through the Studio Settings or by sending an erasure request to <a href={`mailto:${brand.supportEmail}`} className="text-neutral-900 font-semibold underline">{brand.supportEmail}</a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-neutral-900">4. Contact Us</h2>
            <p>
              Questions or requests regarding your personal data? Reach out to our Data Protection Officer at <a href={`mailto:${brand.supportEmail}`} className="text-neutral-900 font-semibold underline">{brand.supportEmail}</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer onSelectView={(v) => {
        if (v === 'home') setLocation('/');
        else if (v === 'builder') setLocation('/studio');
        else if (v === 'templates') setLocation('/templates');
        else if (v === 'pricing') setLocation('/pricing');
      }} />
    </div>
  );
}

export function TermsPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Navbar activeView="terms" />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16">
        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700">
            <FileText className="w-3.5 h-3.5" />
            <span>Terms of Service</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Terms of Service</h1>
          <p className="text-sm text-neutral-500">Last updated: September 2026</p>
        </div>

        <div className="prose prose-neutral max-w-none space-y-8 text-neutral-700 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-neutral-900">1. Acceptance of Terms</h2>
            <p>
              By accessing or creating an account on {brand.productName} ({brand.domain}), you agree to comply with and be bound by these Terms of Service. If you disagree with any portion, you must discontinue using our services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-neutral-900">2. Acceptable Use Policy</h2>
            <p>
              You are entirely responsible for all content, links, media, and text published to your public bio profiles. You agree not to publish or link to:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-neutral-600">
              <li>Phishing websites, malicious software, spyware, or fraudulent credential-harvesting schemes.</li>
              <li>Illegal narcotics, unlicensed weapons, or violent extremist material.</li>
              <li>Unsolicited commercial spam or automated link farms.</li>
              <li>Content violating third-party intellectual property or copyright without explicit authorization.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-neutral-900">3. Subscriptions & Billing</h2>
            <p>
              Paid subscription tiers (such as Pro and Studio) provide access to premium functionality including custom domain routing, multi-profile rosters, and white-label badges. Subscriptions renew automatically until canceled in your account settings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-neutral-900">4. Limitation of Liability</h2>
            <p>
              {brand.productName} is provided on an "as is" and "as available" basis. While we maintain a 99.9% uptime target and automated zero-downtime database backups, we are not liable for indirect or consequential damages arising from service interruption.
            </p>
          </section>
        </div>
      </main>
      <Footer onSelectView={(v) => {
        if (v === 'home') setLocation('/');
        else if (v === 'builder') setLocation('/studio');
        else if (v === 'templates') setLocation('/templates');
        else if (v === 'pricing') setLocation('/pricing');
      }} />
    </div>
  );
}

export function ContactPage() {
  const [, setLocation] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Navbar activeView="contact" />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700">
            <Mail className="w-3.5 h-3.5" />
            <span>Get in Touch</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">We'd love to hear from you.</h1>
          <p className="text-neutral-500 text-sm max-w-lg mx-auto">
            Have a question about custom domains, agency partnerships, or migration from another platform? Send our creator concierge team a message.
          </p>
        </div>

        {submitted ? (
          <div className="p-8 rounded-3xl bg-neutral-50 border border-neutral-200 text-center space-y-4 max-w-md mx-auto">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h2 className="text-lg font-bold text-neutral-900">Message Received!</h2>
            <p className="text-xs text-neutral-600">
              Thank you for reaching out. A creator specialist will respond to <strong>{email}</strong> within 24 hours.
            </p>
            <button
              onClick={() => setLocation('/')}
              className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
            >
              Return Home
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 rounded-3xl bg-neutral-50/70 border border-neutral-200 space-y-5 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Elena Rostova"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="elena@studio.design"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">How can we help?</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us about your project or inquiry..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-neutral-900 text-white text-xs font-bold hover:bg-black transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Send Message</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </main>
      <Footer onSelectView={(v) => {
        if (v === 'home') setLocation('/');
        else if (v === 'builder') setLocation('/studio');
        else if (v === 'templates') setLocation('/templates');
        else if (v === 'pricing') setLocation('/pricing');
      }} />
    </div>
  );
}

export function AboutPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Navbar activeView="about" />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16">
        <div className="space-y-4 mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">The Design-First Promise</h1>
          <p className="text-neutral-500 text-base max-w-xl mx-auto leading-relaxed">
            Why we built {brand.productName} and how we're changing the way creators present themselves on the web.
          </p>
        </div>

        <div className="space-y-10 text-neutral-700 text-sm sm:text-base leading-relaxed">
          <p>
            For a decade, link-in-bio tools treated creator identity as an afterthought: uniform vertical lists of rounded buttons encased in neon gradients and covered in third-party logos.
          </p>
          <p>
            We created <strong>{brand.productName}</strong> because we believe modern artists, independent publishers, podcast hosts, and studios deserve tools that respect their aesthetic standards. A link-in-bio shouldn't look like a generic directory; it should look like a bespoke, editorial micro-site that reflects your craft.
          </p>
          <div className="p-8 rounded-3xl bg-neutral-50 border border-neutral-200 space-y-4">
            <h2 className="text-xl font-bold text-neutral-900">Our Three Core Design Tenets</h2>
            <ul className="space-y-3 text-neutral-600 text-sm">
              <li><strong>1. Editorial Typography First:</strong> Beautiful serif and sans-serif pairings engineered for readability and distinction.</li>
              <li><strong>2. Native Media Over Naked URLs:</strong> Let visitors play your latest track or watch your film trailer without leaving your page.</li>
              <li><strong>3. Sovereign Identity:</strong> 100% white-label options and custom domains so your audience always remembers your brand, not ours.</li>
            </ul>
          </div>
          <div className="pt-6 text-center">
            <button
              onClick={() => setLocation('/register')}
              className="px-6 py-3.5 rounded-2xl bg-neutral-900 text-white font-bold text-sm hover:bg-black transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Build your micro-site</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
      <Footer onSelectView={(v) => {
        if (v === 'home') setLocation('/');
        else if (v === 'builder') setLocation('/studio');
        else if (v === 'templates') setLocation('/templates');
        else if (v === 'pricing') setLocation('/pricing');
      }} />
    </div>
  );
}
