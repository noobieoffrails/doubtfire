# Home Care Island Asset

- Output: `public/images/home-care-island.png`
- UI crop: `public/images/home-care-island-cropped.png` (720 x 900 RGBA PNG)
- Format: 1024 x 1024 RGBA PNG
- Use: Decorative object group in the upper-right home surface island
- Method: Built-in image generation with local `#ff00ff` chroma-key removal
- Visual reference: `.impeccable/mocks/color-islands.png`

## Validation

- All four corner alpha values are `0`.
- The visible subject bounds are `611 x 817` pixels.
- The visible subject covers `25.0%` of the canvas pixels.
- The clear edge padding is 237 px left, 108 px top, 176 px right, and 99 px bottom.
- The UI crop removes excess transparent padding. It does not crop the object group.

## Generation record

The full generation prompt is stored in the PNG metadata. The prompt asked for a clean studio image with these items:

- One aqua spray bottle.
- Two folded pale-blue cloths.
- One small green plant in a white pot.

The prompt prohibited text, logos, people, extra objects, and product claims. It used one flat magenta background so that the background could be removed.
