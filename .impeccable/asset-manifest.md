# Home Care Island Asset

- Output: `public/images/home-care-island.png`
- UI crop: `public/images/home-care-island-cropped.png` (720 x 900 RGBA PNG)
- Format: 1024 x 1024 RGBA PNG
- Use: Decorative object group in the upper-right home surface island
- Method: Built-in image generation with local `#ff00ff` chroma-key removal
- Reference: `.impeccable/mocks/color-islands.png`

## Validation

- All four corner alpha values are `0`.
- The visible subject bounds are `611 x 817` pixels.
- The visible subject covers `25.0%` of the canvas pixels.
- The clear edge padding is 237 px left, 108 px top, 176 px right, and 99 px bottom.
- The UI crop removes excess transparent padding. It does not crop the object group.

## Generation prompt

```text
Use case: product-mockup
Asset type: transparent decorative home-page still-life asset for the approved Doubtfire Color Islands web composition
Input images: Image 1 is a composition and visual-style reference only; do not reproduce any interface, text, controls, icons, colored islands, layout, or branding from it
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for local background removal; one exact uniform color across the whole canvas; no floor plane, no background shadow, no gradient, no texture, no reflection, and no lighting variation
Subject: one clean translucent aqua trigger spray bottle with a white and cobalt-blue spray head, two neatly folded pale-blue microfiber cloths arranged low in front, and one small fresh green leafy houseplant in a simple unbranded matte white pot on the right
Style/medium: premium clean studio product photography, fresh light modern domestic-care atmosphere, realistic but softly polished, similar material clarity and visual balance to the still life in Image 1
Composition/framing: square 1024-style source; compact cohesive object group centered slightly right; bottle left-center, folded cloths across the lower foreground, plant rising on the right; all objects fully visible; generous even padding on every side; strong readable silhouette at small web size; no cropping
Lighting/mood: bright soft diffused studio light on the objects only, supportive, calm, fresh; retain realistic dimensionality within the group
Color palette: aqua transparent bottle, pale sky-blue cloths, fresh natural green leaves, clean white pot, cobalt-blue nozzle details; never use magenta or pink in the subject
Materials/textures: subtly translucent molded plastic bottle with visible pale-aqua liquid, realistic microfiber loops and folds, natural leaf veins, fine matte ceramic pot
Text: none
Constraints: isolated object group only; crisp clean edges suitable for chroma-key removal; the entire outside background must remain exact flat #ff00ff; no cast shadow or contact shadow outside the object group; no logos, no brands, no labels, no claims, no people, no hands, no extra objects, no watermark
Avoid: any UI, typography, symbols, buttons, cards, color fields, border frames, shelf, table, room scene, floor, reflections outside objects, pink or magenta highlights or spill on object edges
```
