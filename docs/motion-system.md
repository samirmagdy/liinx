# GSAP motion system

Baseline: `main` at `4c07ac6f6b7be9d9e2e517da8fc9cc8f96bbae7e`; clean before this work. Changes are uncommitted.

## Audit and direction

React 19 / TypeScript, Vite 6, Tailwind 4, Wouter. App routes cover marketing Home, Features, Templates, Pricing, About, Contact, Privacy, Terms, login/register, Studio, and public profile/subpage paths. Shared providers own language and authentication. Express APIs and SQLite persistence are outside this motion change.

Marketing composition: Navbar, Hero with real PhonePreview renderer and illustrative data, FeaturesSection, TemplatesSection, PricingSection, FaqSection, Footer. Separate FeaturesPage uses its own content; creator testimonials are public block content, not a new marketing testimonial section. Studio, forms, uploads, analytics, public rendering and creator-selected link animations remain in their existing modules. Tailwind breakpoints: 640/768/1024/1280/1536; motion simplifies below 1024. Existing CSS includes ambient background effects and creator-configurable link effects.

Confirmed previous motion issues: CSS transition declarations existed only on the hidden reveal state; Features used `animate` attributes on ordinary divs; the phone combined a continuous CSS float with Motion transforms. These are replaced/removed. Motion had no remaining source consumers after migration and was removed.

| Decision | Reference | Applied role |
| --- | --- | --- |
| Keep existing neutral/amber canvas, type, density and layout | Existing Liinx + user's Apple restraint direction | Preserve brand while changing motion |
| One overlapped hero timeline | User's GSAP brief / selected storytelling direction | Eyebrow, headline, copy, CTA, device, controls |
| Small, fast feedback | Refero bundled Motion & Micro-interactions guide / user's Linear direction | 180ms pointer response; CSS hover/press |
| Group card reveals | User's ScrollTrigger brief | One trigger per grid, stagger capped at 240ms |
| English word reveal, Arabic whole heading | User's SplitText and localization constraints | Preserve shaping and readable accessible names |

## Implementation

- `src/animations/gsap.ts`: central plugin registration, timings (180/320/600/900ms), easings, matchMedia conditions, grouped scroll reveal with keyboard completion.
- `src/animations/useHeroMotion.ts`: one entrance timeline; English SplitText words preserve responsive wrapping, Arabic uses unsplit text. SplitText reverts on language change/unmount. Desktop fine-pointer devices get 12px scrub parallax and a primary CTA magnetic response clamped to 4px through quickTo. Preview selection fades the real updated preview; it does not simulate actions or metrics.
- `src/components/motion/Reveal.tsx`: scoped useGSAP and matchMedia; one trigger per section/group. Feature, template and pricing grids reveal individual cards over at most 240ms. Header/toggle wrappers use short reveals. Focus completes a pending group immediately.
- `src/components/motion/AccordionPanel.tsx`: React controls expanded state and inert/ARIA state; GSAP animates disclosure height/opacity and refreshes offsets on completion. Hidden panels cannot receive focus. Height animation is limited to this disclosure transition.
- `src/animations/usePanelMotion.ts`: a single scoped entrance timeline for mounted mobile navigation links; close removes the menu immediately. Refresh occurs after layout changes, never on each scroll frame.
- `src/index.css`: small hover/press feedback; hover lift is limited to fine pointers. Old reveal CSS and continuous phone float removed.
- `vite.config.ts`: dedicated GSAP chunk and separate existing confetti chunk.

All GSAP ownership is local through useGSAP/matchMedia; no global killAll. Motion preferences respond live. Reduced motion creates no hero/reveal/scrub animation and finishes disclosure state immediately. Mobile travel is 6–8px, with no magnetic or parallax effects. No permanent opacity hiding is shipped in HTML/CSS. No-JS content remains readable; JS-dependent controls retain the existing application's limitations.

No pinned section was added: the existing feature grid does not contain a matching multi-step product demonstration. No new ambient loops, fabricated statistics, SVG morphs, or extra animation libraries were added. Existing public link animation choices and background CSS remain supported.

Dependencies added: `gsap@3.15.0`, `@gsap/react@2.1.2`. Removed: `motion` and its now-unused transitive dependencies.

## Verification commands

`npm run lint`

`npm run build`

`npx vite --host 127.0.0.1 --port 4187 --strictPort`

`node scripts/check-motion.mjs`

`MOTION_TEST_CHANNEL=chrome node scripts/check-motion.mjs`

`MOTION_TEST_BROWSER=firefox node scripts/check-motion.mjs`

`MOTION_TEST_BROWSER=webkit node scripts/check-motion.mjs`

Browser checks use isolated contexts and explicit anonymous API fixtures; all third-party requests are blocked. These are frontend animation checks, not live API/provider evidence. Screenshots therefore include unavailable external artwork. Each matrix covers eight widths (320,375,430,768,1024,1280,1440,1920), English/Arabic, and normal/reduced motion; it checks overflow, visible cards, keyboard FAQ, menu state, route cleanup, and live motion-preference changes. WebKit evidence is not a test of the installed Safari application. Edge and physical devices remain unverified.

Official implementation references: [GSAP React cleanup](https://gsap.com/resources/React/), [SplitText](https://gsap.com/docs/v3/Plugins/SplitText/), [matchMedia](https://gsap.com/docs/v3/GSAP/gsap.matchMedia/).

Measured frame rate, universal browser compatibility, zero FOUC under every delayed-hydration condition, and production readiness are not claimed.
