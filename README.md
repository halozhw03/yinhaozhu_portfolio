# Yinhao Zhu Portfolio

A web-based portfolio showcase built with HTML, CSS, and JavaScript, featuring an embedded PDF viewer using PDF.js.

## Features

- 📄 Embedded PDF viewer with smooth navigation
- 📱 Fully responsive design (mobile, tablet, desktop)
- ⌨️ Keyboard navigation support (arrow keys)
- 🔍 Zoom controls (zoom in, zoom out, fit to width)
- 🎨 Modern, clean UI design
- ⚡ Fast loading with CDN resources

## Local Development

### Option 1: Simple HTTP Server

Using Python 3:
```bash
python3 -m http.server 8000
```

Using Python 2:
```bash
python -m SimpleHTTPServer 8000
```

Using Node.js (http-server):
```bash
npx http-server -p 8000
```

Then open `http://localhost:8000` in your browser.

### Option 2: VS Code Live Server

If you're using VS Code, install the "Live Server" extension and click "Go Live" in the status bar.

## Deployment to GitHub Pages

### Step 1: Push to GitHub

1. Create a new repository on GitHub (or use existing one)
2. Initialize git in this directory (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Portfolio website"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

### Step 2: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on "Settings"
3. Scroll down to "Pages" section
4. Under "Source", select "Deploy from a branch"
5. Choose "main" branch and "/ (root)" folder
6. Click "Save"
7. Your site will be available at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

### Important Notes

- The PDF file (`compressed_portfolio.pdf`) is managed using Git LFS (Large File Storage)
- Git LFS is required to properly handle the PDF file. Make sure Git LFS is installed:
  ```bash
  git lfs install
  ```
- The PDF file will be automatically tracked by LFS via `.gitattributes` configuration

## File Structure

```
yinhaozhu_portfolio/
├── index.html              # Main HTML page
├── css/
│   └── style.css          # Stylesheet
├── js/
│   └── main.js            # PDF.js integration and controls
├── compressed_portfolio.pdf  # Portfolio PDF file (managed by Git LFS)
├── .gitattributes         # Git LFS configuration
└── README.md              # This file
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Customization

### Change PDF File

Update the `getPDFPath()` function in `js/main.js`:
```javascript
function getPDFPath() {
    return 'YOUR_PDF_FILENAME.pdf';
}
```

### Modify Colors

Edit CSS variables in `css/style.css`:
```css
:root {
    --primary-color: #2c3e50;
    --secondary-color: #3498db;
    /* ... */
}
```

### Adjust Zoom Levels

Modify zoom limits in `js/main.js`:
```javascript
// In onZoomOut function
if (scale <= 0.5) { // Minimum zoom
    return;
}

// In onZoomIn function
if (scale >= 3.0) { // Maximum zoom
    return;
}
```

## License

This project is open source and available for personal use.
