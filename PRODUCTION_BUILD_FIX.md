# Production Build 404 Error Fix

## Problem Description
The application worked fine in development mode (`npm run dev`) but failed in production with 404 errors after running `npm run build` and serving the built files.

## Root Cause Analysis

### Issue 1: References to Non-Existent Files in Production
The `index.html` file contained references to files that only exist in development:

1. **Font file reference**: `/fonts/mono.woff2`
   - This font file was referenced but didn't exist in the project
   - Would cause a 404 error in production

2. **Node modules references**: 
   - `/node_modules/ag-grid-community/styles/ag-grid.css`
   - `/node_modules/ag-grid-community/styles/ag-theme-quartz.css`
   - `/node_modules/ag-grid-community/dist/ag-grid-community.auto.esm.js`
   - The `node_modules` folder doesn't exist in production builds
   - These files should be bundled by Vite, not referenced directly

3. **Source file reference**: `/src/main.tsx`
   - Source files are compiled and bundled in production
   - This should be handled by Vite's build process

### Issue 2: Vite Build Process
During the build process, Vite:
- Transforms the `index.html` file
- Replaces development references with production bundle references
- Injects the correct script and link tags for the bundled assets

However, the problematic references were causing issues before Vite could properly process them.

## Solution Applied

### 1. Fixed Font Reference
```html
<!-- Before -->
<link rel="preload" as="font" href="/fonts/mono.woff2" type="font/woff2" crossorigin />

<!-- After -->
<!-- <link rel="preload" as="font" href="/fonts/mono.woff2" type="font/woff2" crossorigin /> -->
```
- Commented out the non-existent font reference
- If you need custom fonts, add them to the `public/fonts` directory

### 2. Removed Direct Node Modules References
```html
<!-- Before -->
<link rel="prefetch" href="/node_modules/ag-grid-community/styles/ag-grid.css" />
<link rel="prefetch" href="/node_modules/ag-grid-community/styles/ag-theme-quartz.css" />

<!-- After -->
<!-- AG-Grid CSS will be bundled by Vite -->
```
- Removed direct references to node_modules
- These styles are already imported in the source code and bundled by Vite

### 3. Fixed AG-Grid Preload Script
```javascript
// Before
link.href = '/node_modules/ag-grid-community/dist/ag-grid-community.auto.esm.js';

// After
// AG-Grid is already bundled by Vite
// link.href = '/assets/ag-grid-vendor.js';
```
- Commented out the incorrect preload
- AG-Grid is already included in the `ag-grid-vendor` chunk created by Vite

## How the Production Build Works

### 1. Build Process
```bash
npm run build
```
This command:
- Runs TypeScript compiler (`tsc -b`)
- Runs Vite build process
- Creates optimized bundles in the `dist` folder

### 2. Output Structure
```
dist/
├── index.html          # Transformed HTML with correct asset references
├── assets/
│   ├── *.js           # JavaScript bundles
│   ├── *.css          # CSS bundles
│   └── ...            # Other assets
```

### 3. Serving Production Build
**Correct methods:**
```bash
# Method 1: Vite preview (recommended for testing)
npm run preview

# Method 2: Static file server
npx serve -s dist

# Method 3: Python HTTP server
cd dist && python -m http.server 8000
```

**Incorrect method:**
- Opening `dist/index.html` directly in browser (file:// protocol)
- Serving from project root instead of `dist` folder

## Prevention Tips

### 1. Keep index.html Clean
- Don't reference files in `node_modules` directly
- Don't reference source files directly
- Let Vite handle bundling and asset injection

### 2. Use Public Directory for Static Assets
- Place static assets in the `public` directory
- Reference them with absolute paths starting with `/`
- Example: `/fonts/custom-font.woff2` → `public/fonts/custom-font.woff2`

### 3. Import Dependencies in Source Code
```javascript
// Correct way to include AG-Grid styles
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
```

### 4. Test Production Builds Locally
Always test production builds before deployment:
```bash
npm run build
npm run preview
```

## Vite Configuration Notes

The current `vite.config.ts` correctly handles:
- Module bundling and code splitting
- Asset optimization
- Chunk size management
- Path aliasing

No changes were needed to the Vite configuration for this fix.

## Summary

The 404 errors in production were caused by hardcoded references to development-only files in `index.html`. By removing these references and letting Vite handle the bundling process correctly, the production build now works as expected. The key lesson is to trust Vite's build process and avoid manual references to source files or node_modules in the HTML template.