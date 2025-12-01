# Deployment Instructions for polydrop.fun

## Method 1: Upload via Hostinger File Manager (Easiest)

1. Go to [Hostinger hPanel](https://hpanel.hostinger.com)
2. Select your domain: **polydrop.fun**
3. Go to **File Manager**
4. Navigate to `public_html/` folder
5. Upload `index.html` from this folder
6. Visit https://polydrop.fun

## Method 2: FTP Upload

1. Get FTP credentials from Hostinger hPanel
2. Connect using FTP client (FileZilla, etc.)
3. Upload `index.html` to `public_html/`
4. Done!

## Method 3: GitHub Integration

1. In Hostinger hPanel, go to **Website** → **GitHub Integration**
2. Connect repository: `Kimzimi/polydrop`
3. Set build command: `npm run build`
4. Deploy branch: `main`

## Files to Deploy

- `index.html` - Main application file (standalone, no dependencies needed)

## Post-Deployment

After deployment, your site will be live at:
- https://polydrop.fun
- https://www.polydrop.fun

The application is a static HTML file with no server-side requirements.
