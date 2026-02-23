# Q-SHIELD App Icon Generation Guide

## Source Icon
Use `public/icons/icon-512x512.png` as the master icon.

## Required iOS Icon Sizes
Generate these from the 512x512 source using any image resize tool or `capacitor-assets`:

| Size     | Usage                    |
|----------|--------------------------|
| 20x20    | iPad Notification        |
| 29x29    | Settings                 |
| 40x40    | Spotlight                |
| 60x60    | iPhone App               |
| 76x76    | iPad App                 |
| 83.5x83.5| iPad Pro App             |
| 1024x1024| App Store                |

Each size also needs @2x and @3x variants (e.g., 20@2x = 40px, 20@3x = 60px).

## Required Android Icon Sizes

| Density  | Size     | Folder      |
|----------|----------|-------------|
| mdpi     | 48x48    | mipmap-mdpi |
| hdpi     | 72x72    | mipmap-hdpi |
| xhdpi    | 96x96    | mipmap-xhdpi|
| xxhdpi   | 144x144  | mipmap-xxhdpi|
| xxxhdpi  | 192x192  | mipmap-xxxhdpi|
| Play Store | 512x512 | -          |

## Recommended Approach (Automated)

After pulling the project locally, run:
```bash
npx @capacitor/assets generate --iconBackgroundColor '#0a0a0f' --iconBackgroundColorDark '#0a0a0f'
```

This auto-generates all iOS and Android icon sizes from the source icon.

Place the source icon at:
- `resources/icon.png` (1024x1024 recommended)
- `resources/splash.png` (2732x2732 recommended)

Then run `npx cap sync` to apply.
