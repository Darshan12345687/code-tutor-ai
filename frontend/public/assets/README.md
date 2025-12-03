# SEMO Learning Assistance Program - Assets

## Folder Structure

```
assets/
├── images/          # General images (backgrounds, patterns, etc.)
├── logos/          # SEMO logos and branding images
└── README.md       # This file
```

## Required Images

### Logos
Place the following SEMO official logos in `assets/logos/`:
- **`semo logo.png`** - Main SEMO logo (PNG format) - **PRIMARY LOGO**
- `semo-logo.png` - Alternative SEMO logo (PNG format)
- `semo-logo.svg` - SEMO logo (SVG format) - Fallback

The system will automatically try these paths in order:
1. `/assets/logos/semo logo.png` (primary)
2. `/assets/logos/semo-logo.png` (alternative)
3. `/assets/logos/semo-logo.svg` (fallback)

### Images
Place any background images, patterns, or decorative images in `assets/images/`:
- Any SEMO-themed images or patterns

## Usage

The website will automatically use these images:
- **Header logo**: `/assets/logos/semo logo.png`
- Background patterns: `/assets/images/` (if used)

## Image Requirements

- **Format**: PNG (preferred) or SVG
- **Logo**: Should be high resolution, transparent background recommended
- **Colors**: Should match SEMO brand colors (#C8102E red, #8B1538 dark red)
- **File naming**: Use lowercase with spaces or hyphens (e.g., `semo logo.png` or `semo-logo.png`)

## Notes

- The logo path supports files with spaces in the name (e.g., `semo logo.png`)
- If the PNG logo doesn't exist, the system will automatically fall back to the SVG version
- Make sure to place your SEMO logo PNG file in `/frontend/public/assets/logos/` directory
