---
name: Doubtfire
description: Fresh, calm household care shaped through broad color islands.
colors:
  deep-navy: "#10184d"
  muted-navy: "#56628b"
  action-cobalt: "#075cf5"
  action-cobalt-deep: "#0047d7"
  open-sky: "#e3f3ff"
  clear-sky: "#9ed8ff"
  fresh-mint: "#e5f7ef"
  leaf-mint: "#7dd9bb"
  soft-lilac: "#efe9ff"
  bright-lilac: "#bba6ff"
  warm-coral: "#ff827d"
  cool-ice: "#f7fbff"
  clean-white: "#ffffff"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(2.55rem, 11.4vw, 4.8rem)"
    fontWeight: 780
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(1.75rem, 5vw, 2.15rem)"
    fontWeight: 780
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(1.15rem, 5.6vw, 1.42rem)"
    fontWeight: 760
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "1rem"
    fontWeight: 520
    lineHeight: 1.5
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 750
    lineHeight: 1.2
rounded:
  control: "14px"
  pill: "999px"
  field-small: "28px"
  field-large: "84px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "28px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.action-cobalt}"
    textColor: "{colors.clean-white}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.action-cobalt-deep}"
    textColor: "{colors.clean-white}"
  routine-sky:
    backgroundColor: "{colors.open-sky}"
    textColor: "{colors.deep-navy}"
    typography: "{typography.title}"
    padding: "14px 18px"
    height: "108px"
  routine-mint:
    backgroundColor: "{colors.fresh-mint}"
    textColor: "{colors.deep-navy}"
    typography: "{typography.title}"
    padding: "14px 18px"
    height: "108px"
  routine-lilac:
    backgroundColor: "{colors.soft-lilac}"
    textColor: "{colors.deep-navy}"
    typography: "{typography.title}"
    padding: "14px 18px"
    height: "108px"
---

# Design System: Doubtfire

## Overview

**Creative North Star: "Color Islands"**

Doubtfire is a fresh, light, and modern household utility. Familiar controls sit on an open white surface. Broad fields of sky, mint, and lilac give the product a clear style. The interface is direct and supportive. It gives people a calm place to start without scores, debt, or pressure.

The layout uses a familiar app structure: a compact header, one clear opening action, a short Routine list, and fixed primary navigation on phones. Color makes each choice easy to identify. It does not report status or urgency.

**Key Characteristics:**

- Broad color fields instead of a neutral card dashboard.
- Deep navy type and cobalt actions on white or cool-ice surfaces.
- Asymmetric soft corners and almost-flat depth.
- Generous open space with compact, familiar controls.
- Supportive copy with no competitive or warning-heavy language.

## Colors

The palette combines clean cool neutrals with one confident action color and three calm household-care islands.

### Primary

- **Action Cobalt**: The main action, active navigation, and focus indicator.
- **Deep Navy**: Headings, strong labels, and authored line icons.

### Secondary

- **Open Sky**: The welcome still-life field and Weekly Routine.
- **Fresh Mint**: The Fortnightly Routine and selected text.
- **Soft Lilac**: The Quarterly Routine and quiet atmosphere.

### Tertiary

- **Warm Coral**: One small decorative counterpoint. It never means danger, debt, or an overdue state.

### Neutral

- **Clean White**: The main application surface and control ground.
- **Cool Ice**: The outer tablet ground and PWA theme color.
- **Muted Navy**: Supporting copy and inactive navigation.

**The Color-Island Rule.** Use sky, mint, and lilac as broad navigable fields. Do not reduce them to small badges on white cards.

**The Coral Restraint Rule.** Coral is decorative and rare. Do not use it for warnings.

## Typography

**Display Font:** Manrope (with sans-serif fallback)  
**Body Font:** Manrope (with sans-serif fallback)

**Character:** Manrope gives the interface a rounded, contemporary voice while keeping household instructions clear. Tight display spacing adds confidence; body copy remains open and easy to scan.

### Hierarchy

- **Display** (780, responsive 2.55–4.8 rem, 0.98): Short greetings only.
- **Headline** (780, responsive 1.75–2.15 rem, 1.05): Primary section headings.
- **Title** (760, responsive 1.15–1.42 rem): Routine names and other strong choices.
- **Body** (520, 1 rem, 1.5): Instructions and supporting text.
- **Label** (750, 0.875 rem): Compact controls such as the language toggle.

**The Short-Display Rule.** Keep display text short enough to stay clear at a tight line height. Use body styles for explanations.

## Layout

Phone screens use a compact 70 px header, a two-column welcome region, a vertically stacked Routine list, and fixed bottom navigation. Main content keeps 20 px side padding. Each Routine field is at least 108 px high, with 12 px between fields.

At 760 px and wider, the interface becomes a contained two-column household panel rather than a stretched phone. The panel is at most 1020 px wide. The welcome moves left, Routines move right, and navigation becomes part of the panel flow. The outer cool-ice ground and restrained ambient gradients make the panel distinct.

Keep touch targets at least 46–48 px high. Preserve space around the greeting and the large color fields. Do not add dense summary cards above the main action.

## Elevation & Depth

The system is almost flat. Tonal fields and overlapping shapes carry most of the hierarchy. Use a soft action shadow for the primary button, a low ambient shadow for the contained tablet surface, and image-native depth inside the decorative still life.

### Shadow Vocabulary

- **Action lift** (`0 14px 28px -16px rgb(7 92 245 / 65%)`): The enabled cobalt primary action.
- **Ambient float** (`0 22px 52px -36px rgb(27 43 94 / 42%)`): Small white icon discs and quiet floating controls.
- **Tablet surface** (`0 34px 90px -58px rgb(16 24 77 / 52%)`): The wide-screen application panel only.

**The Flat-First Rule.** Use color and spacing before adding a shadow. A shadow must explain a control or contained surface.

## Shapes

Controls use compact 14–16 px corners or full pills. Signature Routine fields use large, asymmetric corner profiles from 28 px to 84 px. The welcome image field uses an asymmetric organic curve. White circular icon grounds help line icons read against colored fields.

Do not make every region a rounded rectangle. The contrast between open white sections and shaped color islands is part of the identity.

## Components

### Buttons

- **Shape:** Compact and gently curved (14 px) with a minimum height of 48 px.
- **Primary:** Action cobalt with white text and strong weight.
- **Hover / Focus:** Deepen to action-cobalt-deep on hover. Use a 3 px cobalt focus outline with a 4 px offset.
- **Disabled:** Keep the shape and label legible, remove the action shadow, add a lock icon, and explain availability nearby.

### Cards / Containers

- **Corner Style:** Routine fields use distinct asymmetric profiles; the tablet surface uses a 42 px outer radius.
- **Background:** White for the main surface; sky, mint, and lilac for Routine fields.
- **Shadow Strategy:** Flat by default; use the documented ambient shadows only.
- **Border:** No visible border on color islands.

### Navigation

The phone navigation is fixed to the bottom and has three equal areas. Icons use a consistent 2 px line weight. Inactive items use muted navy. The active Home item uses cobalt and a short top indicator. Focus uses the global cobalt outline.

### Routine Field

Each Routine is one broad, disabled Phase 1 field with a white circular calendar icon, a strong title, and faint authored linework. Weekly uses sky and plant linework; Fortnightly uses mint and a cleaning caddy; Quarterly uses lilac and a storage box with a plant. When these fields become active, preserve the silhouette and clear full-field target.

### Language Toggle

Use a white 46 px pill with a fine deep-navy translucent border, a globe icon, and the current two-letter language code. The action changes the server-readable language cookie so the next render has no language flash.

## Do's and Don'ts

### Do:

- **Do** use broad sky, mint, and lilac fields to organize the primary choices.
- **Do** keep copy short, direct, supportive, and compatible with ASD-STE100 Simplified Technical English.
- **Do** use deep navy for readable hierarchy and cobalt for actions, focus, and active state.
- **Do** keep motion small and optional. The still-life settle runs only when reduced motion is not requested.
- **Do** adapt the composition at 760 px instead of scaling the phone layout.

### Don't:

- **Don't** build a neutral dashboard from many small white cards.
- **Don't** show scores, percentages, denominators, task debt, competitive coaching, or warning-heavy states.
- **Don't** use coral as a warning color.
- **Don't** add shadows only for decoration.
- **Don't** copy reference brands, logos, product claims, or device imagery.
