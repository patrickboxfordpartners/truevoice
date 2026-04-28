# Product

## Register

brand

## Users

Hiring managers, talent acquisition teams, and HR directors at mid-to-large companies who conduct remote video interviews. They're concerned about candidates using AI tools (ChatGPT, screen-reading, coached responses) to game interviews. They need objective data to make confident hiring decisions. Frequency: daily to weekly interview scheduling, reviewing reports after each session.

## Product Purpose

TrueVoice HQ detects AI-assisted interview fraud through real-time speech, visual, and behavioral analysis. It layers three detection methods (audio pattern scoring, webcam behavior analysis, browser activity monitoring) to produce an authenticity score for each candidate. Success looks like: hiring teams trust their interview process again, bad hires from coached/AI-assisted candidates drop measurably.

## Brand Personality

Trustworthy, Clear, Modern. We protect your hiring process. Approachable but serious. Think: a premium security product that doesn't need to intimidate to convey competence. Confidence through clarity, not aggression.

## Anti-references

- Generic SaaS landing pages with gradient hero banners and identical card grids
- Dark "cybersecurity" aesthetics with neon glows and matrix-style visuals
- Overly playful HR tech sites with cartoon illustrations and pastel palettes
- Any site where you can guess the category from the color scheme alone

## Design Principles

1. **Evidence over assertion.** Show the detection layers working, don't just claim they work. The product's credibility comes from demonstrating precision.
2. **Calm authority.** The product handles a sensitive topic (fraud detection in hiring). The design should feel like a trusted advisor, not an alarm system.
3. **Clarity is the feature.** Every element should reduce cognitive load. If something needs explanation, it's not designed well enough.
4. **Restraint signals quality.** One accent color used sparingly. Generous whitespace. Let the content breathe. Rarity of color makes it meaningful.
5. **Earn trust visually.** Typography, spacing, and hierarchy should feel considered and precise. Sloppy design undermines a product about detecting sloppiness.

## Accessibility & Inclusion

WCAG 2.1 AA minimum. Respect prefers-reduced-motion. Ensure sufficient contrast ratios on all text. All interactive elements keyboard-navigable with visible focus states.

## References

- **Linear.app**: Clean confidence, precise typography, purposeful motion, dark-on-light done right
- **Stripe.com**: Rich but restrained color, polished visual hierarchy, premium yet approachable, editorial quality
- **Boxford Partners family**: Footer must remain consistent with sister products (same structure, "A Boxford Partners Company" badge)

## Technical Constraints

- React 18 + TypeScript + Vite
- Tailwind CSS 3
- Framer Motion for animations
- Supabase auth
- Stripe payments (3 tiers: Starter $79, Pro $149, Scale $349)
- No free trial, no "Get Started" flow
- Sign-in page, not signup (new users come through Stripe checkout)
