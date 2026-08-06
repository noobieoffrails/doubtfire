# Home Surface Brief

## Approved visual world

The structure is the category standard: a familiar mobile utility with clear navigation, one main action, and a short routine list.

The visual world is fresh, light, and modern. It combines:

- Roborock's pale cool surfaces, strong blue controls, and restrained depth.
- Oral-B's confident cobalt, deep navy, cyan, and small bright accents.
- LARQ's white space, soft color wash, deep teal, mint, sky, and lilac.
- Woods Connect's bright domestic setting, direct controls, and white-and-blue clarity.

The product must remain supportive. Color adds energy, but it must not signal a score or overdue debt.

## Approved composition

The user approved Color Islands on 2026-08-06. The approved comp is `.impeccable/mocks/color-islands.png`.

The compact opening area puts the greeting and main action at the left and a fresh home-care still life in an aqua island at the right. Three large sky, mint, and lilac Routine fields follow. Familiar language, account, and bottom-navigation controls frame the surface.

Do not literalize the generated comp's decorative sparkles, fake device status bar, or exact product photography. Use semantic app chrome. The still life is atmosphere only and must not imply an endorsed product.

## System extracted from the comp

- Component grammar: open sections and broad color fields, not a grid of small cards.
- Corner language: 14–16 px for controls; large asymmetric 28–48 px corners for Routine fields and the opening image island.
- Line weights: 2 px deep-navy outline icons; no visible border on color islands.
- Elevation: almost flat. Use one low, soft shadow for the main action and image-native depth inside the still life.
- Type ramp: rounded geometric sans; 44–56 px greeting, 28–34 px section heading, 19–24 px Routine title, 16–18 px body, 13–14 px navigation.

## Implementation inventory

| Ingredient | Commitment | Medium |
| --- | --- | --- |
| Header | Doubtfire wordmark, language toggle, account action | Semantic HTML, Clerk control, CSS |
| Opening copy | Large two-line greeting and short instruction | Semantic HTML and CSS |
| Home-care still life | Spray bottle, folded blue cloths, small plant; upper-right aqua island | Generated transparent raster |
| Primary action | Compact cobalt control below the greeting | Semantic button/link and CSS |
| Routine fields | Three wide fields in sky, mint, and lilac with distinct corner profiles | Semantic links, CSS, authored SVG icons |
| Navigation | Home, History, Settings with consistent 2 px line icons | Semantic navigation and authored SVG |
| Responsive layout | Phone composition at 390 px; wider tablet composition without a stretched phone shell | CSS grid and media queries |

Mode: Operate. The main task is to enter the household app quickly. In Phase 1, the primary action is a disabled preview until Run behavior exists.
