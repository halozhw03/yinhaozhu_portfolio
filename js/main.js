// PDF.js configuration
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// PDF state management
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.0;
let canvas = null;
let ctx = null;

// DOM elements
const pdfLoader = document.getElementById('pdf-loader');
const pdfError = document.getElementById('pdf-error');
const pdfViewerContainer = document.getElementById('pdf-viewer-container');
const canvasElement = document.getElementById('pdf-canvas');
const prevBtn = document.getElementById('prev-page');
const nextBtn = document.getElementById('next-page');
const pageNumSpan = document.getElementById('page-num');
const pageCountSpan = document.getElementById('page-count');
const zoomOutBtn = document.getElementById('zoom-out');
const zoomInBtn = document.getElementById('zoom-in');
const zoomLevelSpan = document.getElementById('zoom-level');
const fitWidthBtn = document.getElementById('fit-width');

// Initialize canvas
canvas = canvasElement;
ctx = canvas.getContext('2d');

/**
 * Get page info from document, resize canvas accordingly, and render the page.
 */
function renderPage(num) {
    pageRendering = true;
    
    pdfDoc.getPage(num).then(function(page) {
        // Get device pixel ratio for high-DPI displays
        const devicePixelRatio = window.devicePixelRatio || 1;
        
        // Calculate viewport with current scale
        const viewport = page.getViewport({ scale: scale });
        
        // Set canvas display size (CSS pixels)
        canvas.style.width = viewport.width + 'px';
        canvas.style.height = viewport.height + 'px';
        
        // Set canvas internal size (actual pixels) - multiply by devicePixelRatio for crisp rendering
        const outputScale = devicePixelRatio;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        
        // Reset transform and scale the rendering context to match device pixel ratio
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(outputScale, outputScale);
        
        // Create render context with the scaled viewport
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        
        const renderTask = page.render(renderContext);
        
        renderTask.promise.then(function() {
            pageRendering = false;
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
            
            // Update UI
            pageNumSpan.textContent = num;
            prevBtn.disabled = num <= 1;
            nextBtn.disabled = num >= pdfDoc.numPages;
        });
    });

    // Update page count if not set
    if (pageCountSpan.textContent === '-') {
        pageCountSpan.textContent = pdfDoc.numPages;
    }
}

/**
 * If another page rendering in progress, wait until it's done.
 * Otherwise, execute rendering immediately.
 */
function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

/**
 * Show previous page
 */
function onPrevPage() {
    if (pageNum <= 1) {
        return;
    }
    pageNum--;
    queueRenderPage(pageNum);
}

/**
 * Show next page
 */
function onNextPage() {
    if (pageNum >= pdfDoc.numPages) {
        return;
    }
    pageNum++;
    queueRenderPage(pageNum);
}

/**
 * Zoom out
 */
function onZoomOut() {
    if (scale <= 0.5) {
        return;
    }
    scale -= 0.25;
    updateZoomLevel();
    queueRenderPage(pageNum);
}

/**
 * Zoom in
 */
function onZoomIn() {
    if (scale >= 3.0) {
        return;
    }
    scale += 0.25;
    updateZoomLevel();
    queueRenderPage(pageNum);
}

/**
 * Fit to width
 */
function onFitWidth() {
    if (!pdfDoc) return;
    
    pdfDoc.getPage(pageNum).then(function(page) {
        // Use more of the available width for better readability
        const containerWidth = pdfViewerContainer.clientWidth - 20; // Minimal padding
        const viewport = page.getViewport({ scale: 1.0 });
        scale = containerWidth / viewport.width;
        updateZoomLevel();
        queueRenderPage(pageNum);
    });
}

/**
 * Update zoom level display
 */
function updateZoomLevel() {
    zoomLevelSpan.textContent = Math.round(scale * 100) + '%';
}

/**
 * Show error message
 */
function showError() {
    pdfLoader.style.display = 'none';
    pdfError.style.display = 'block';
    pdfViewerContainer.style.display = 'none';
}

/**
 * Show PDF viewer
 */
function showViewer() {
    pdfLoader.style.display = 'none';
    pdfError.style.display = 'none';
    pdfViewerContainer.style.display = 'flex';
}

/**
 * Load PDF document
 */
function loadPDF() {
    const pdfPath = 'Yinhao Zhu_Portfolio.pdf';
    
    pdfjsLib.getDocument(pdfPath).promise.then(function(pdf) {
        pdfDoc = pdf;
        showViewer();
        // Auto fit to width on initial load for better readability
        onFitWidth();
    }).catch(function(error) {
        console.error('Error loading PDF:', error);
        showError();
    });
}

// Event listeners
prevBtn.addEventListener('click', onPrevPage);
nextBtn.addEventListener('click', onNextPage);
zoomOutBtn.addEventListener('click', onZoomOut);
zoomInBtn.addEventListener('click', onZoomIn);
fitWidthBtn.addEventListener('click', onFitWidth);

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        onPrevPage();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        onNextPage();
    }
});

// Handle window resize
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        if (pdfDoc && pageNum) {
            queueRenderPage(pageNum);
        }
    }, 250);
});

// Initialize PDF loading when page loads
window.addEventListener('DOMContentLoaded', function() {
    loadPDF();
});
