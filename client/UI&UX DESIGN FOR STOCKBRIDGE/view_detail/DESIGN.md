---
name: Professional Fintech Collective
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#bcc9c6'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#879391'
  outline-variant: '#3d4947'
  surface-tint: '#6bd8cb'
  primary: '#6bd8cb'
  on-primary: '#003732'
  primary-container: '#29a195'
  on-primary-container: '#00302b'
  inverse-primary: '#006a61'
  secondary: '#ddb7ff'
  on-secondary: '#490080'
  secondary-container: '#6f00be'
  on-secondary-container: '#d6a9ff'
  tertiary: '#c5c6c8'
  on-tertiary: '#2e3132'
  tertiary-container: '#8f9193'
  on-tertiary-container: '#272a2c'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#89f5e7'
  primary-fixed-dim: '#6bd8cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#005049'
  secondary-fixed: '#f0dbff'
  secondary-fixed-dim: '#ddb7ff'
  on-secondary-fixed: '#2c0051'
  on-secondary-fixed-variant: '#6900b3'
  tertiary-fixed: '#e1e2e4'
  tertiary-fixed-dim: '#c5c6c8'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Sora
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Work Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-margin: 24px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  section-gap: 64px
---

## Brand & Style

This design system is engineered for the high-trust environment of B2B inventory financing and trade. The visual identity balances the rigor of a financial institution with the accessibility required for Indian MSME owners. 

The style is **Modern Corporate with Experimental Accents**. It utilizes a "Dark Mode First" approach to reduce eye strain during prolonged ledger management and inventory tracking. The aesthetic is defined by architectural precision, using sharp geometric headlines to signal cutting-edge technology, while maintaining a grounded, neutral foundation for data density. The goal is to evoke a sense of "digital stability"—a platform that feels as permanent and reliable as a physical storefront.

## Colors

The palette is anchored in **Charcoal (#121212)** to provide a sophisticated, low-fatigue backdrop. 

- **Primary Emerald (#0D9488):** Used for primary actions, success states, and brand-building elements. It represents growth and liquidity.
- **Experimental Purple (#A855F7):** Reserved exclusively for "premium" features, high-level data highlights, or interactive "discovery" moments. It should never exceed 5% of the screen real estate.
- **Surface Strategy:** We use tiered shades of gray (#1A1A1A to #1F2937) to create a sense of physical layering without relying on heavy drop shadows.
- **Semantic Colors:** Success and Warning states use slightly higher saturation than the brand colors to ensure they stand out against the dark backgrounds for immediate cognitive recognition.

## Typography

The typography system employs a dual-font strategy to differentiate between "Atmosphere" and "Information."

- **Headline (Sora):** A geometric sans-serif that brings a tech-forward, high-end feel to the design system. Its wider stance and unique apertures make titles feel intentional and modern.
- **Body (Work Sans):** Chosen for its exceptional legibility at small sizes, especially important for complex tables, SKU numbers, and financial figures.
- **Hierarchy:** We utilize heavy weight contrast (Bold headlines vs. Regular body) to guide the user through information-dense dashboards. Numbers should always use tabular lining to ensure columns in data grids align perfectly.

## Layout & Spacing

This design system follows an **8px grid system** (with a 4px baseline for tighter components) to ensure mathematical harmony.

- **Grid:** A 12-column fluid grid for desktop, transitioning to a 4-column grid for mobile. 
- **White Space:** To accommodate the target audience (Kirana owners who may be new to complex ERPs), we prioritize "Breathing Room." Margins are kept wide (minimum 24px) to prevent the UI from feeling claustrophobic.
- **Data Grids:** For table-heavy views, use a "Comfortable" density setting by default, with 12px vertical padding on rows to maintain touch-friendliness on mobile devices.

## Elevation & Depth

In this dark-themed system, depth is communicated through **Tonal Elevation** and **Subtle Outlines** rather than traditional shadows.

1.  **Level 0 (Base):** Background (#121212). The "ground" of the application.
2.  **Level 1 (Cards/Sidebar):** Surface (#1F2937) with a 1px solid border (#374151).
3.  **Level 2 (Modals/Popovers):** Surface (#2D3748) with a soft, 15% opacity primary-tinted shadow to suggest the element is floating closer to the user.

We avoid heavy blurs to maintain performance on lower-end mobile hardware common in the MSME sector. Physicality is reinforced through high-contrast borders that define the edges of every interactive container.

## Shapes

The shape language is **Soft (0.25rem base)**. 

While the headline font is sharp and geometric, the UI components utilize subtle rounding to feel approachable and "human." 
- **Buttons and Inputs:** Use the standard 4px (0.25rem) radius.
- **Large Cards:** Use 8px (0.5rem) to differentiate them from smaller interactive units.
- **Icons:** Should follow a 2px stroke weight with slightly rounded terminals to match the Work Sans character set.

## Components

- **Buttons:** 
  - *Primary:* Emerald fill with white text. High-contrast. 
  - *Secondary:* Ghost style with #374151 border.
  - *Premium:* Uses a subtle linear gradient from Primary to Secondary accent only for "Upgrade" or "Credit" actions.
- **Input Fields:** Darker background than the card surface to create an "inset" feel. Borders turn Emerald on focus. Labels always sit above the field in `label-md` uppercase.
- **Chips/Badges:** Use a "Low Alpha" approach. A Verified badge is Emerald text on an Emerald background at 10% opacity. This prevents the UI from becoming a "Christmas tree" of loud colors.
- **Cards:** No shadows. Use 1px borders (#374151). Header sections of cards should have a subtle bottom border to separate titles from content.
- **Status Indicators:** Large, clear icons accompanying the text (e.g., a check-circle for "Paid") to ensure accessibility for users with varying levels of digital literacy.