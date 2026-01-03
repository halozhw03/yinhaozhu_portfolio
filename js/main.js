// PDF.js configuration
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// PDF state management
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.5; // Increased default scale for better readability
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
const pdfFileInput = document.getElementById('pdf-file-input');
const selectPdfBtn = document.getElementById('select-pdf-btn');

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
        // Use higher multiplier for better quality on high-DPI displays
        const outputScale = Math.max(devicePixelRatio, 2); // Minimum 2x for high resolution
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        
        // Reset transform and scale the rendering context to match device pixel ratio
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(outputScale, outputScale);
        
        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
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
    if (scale >= 4.0) { // Increased max zoom for better readability
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
 * Show error message with details
 */
function showError(errorDetails) {
    pdfLoader.style.display = 'none';
    pdfError.style.display = 'block';
    pdfViewerContainer.style.display = 'none';
    
    // Add error details to console for debugging
    if (errorDetails) {
        console.error('PDF loading error details:', errorDetails);
        
        // Show more detailed error message to user
        let errorMsg = 'Unable to load PDF. ';
        if (errorDetails.message) {
            errorMsg += errorDetails.message;
        } else if (errorDetails.name === 'MissingPDFException') {
            errorMsg += 'PDF file not found. Please check the file path.';
        } else if (errorDetails.name === 'InvalidPDFException') {
            errorMsg += 'Invalid PDF file. Please check the file format.';
        } else if (errorDetails.name === 'UnexpectedResponseException') {
            errorMsg += 'Network error. If opening locally, please use a local server (e.g., python -m http.server).';
        } else {
            errorMsg += 'Error: ' + (errorDetails.name || 'Unknown error');
        }
        
        const errorElement = pdfError.querySelector('p');
        if (errorElement) {
            errorElement.textContent = errorMsg;
        }
    }
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
 * Get PDF path
 */
function getPDFPath() {
    // Use relative path - works for both local and GitHub Pages
    return 'YinhaoZhu_Portfolio-compressed.pdf';
}

/**
 * Load PDF from file input (for local files)
 */
function loadPDFFromFile(file) {
    if (!file || file.type !== 'application/pdf') {
        showError({ name: 'InvalidFile', message: 'Please select a valid PDF file.' });
        return;
    }
    
    console.log('Loading PDF from file:', file.name);
    pdfLoader.style.display = 'flex';
    pdfError.style.display = 'none';
    
    const fileReader = new FileReader();
    fileReader.onload = function(e) {
        const typedArray = new Uint8Array(e.target.result);
        loadPDFFromData(typedArray);
    };
    fileReader.onerror = function(error) {
        console.error('File reading error:', error);
        showError({ name: 'FileReadError', message: 'Failed to read the PDF file.' });
    };
    fileReader.readAsArrayBuffer(file);
}

/**
 * Load PDF from ArrayBuffer or URL
 */
function loadPDFFromData(data) {
    // Configure PDF.js with high-quality rendering settings
    const loadingTask = pdfjsLib.getDocument({
        data: data,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true,
        verbosity: 0,
        disableAutoFetch: false,
        disableStream: false
    });
    
    loadingTask.promise.then(function(pdf) {
        console.log('PDF loaded successfully. Total pages:', pdf.numPages);
        pdfDoc = pdf;
        pageNum = 1; // Reset to first page
        showViewer();
        // Auto fit to width on initial load for better readability
        setTimeout(() => {
            onFitWidth();
            // If the fit width scale is too small, use a minimum scale
            if (scale < 1.0) {
                scale = 1.0;
                updateZoomLevel();
                queueRenderPage(pageNum);
            }
        }, 100);
    }).catch(function(error) {
        console.error('Failed to load PDF:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        showError(error);
    });
}

/**
 * Load PDF document from URL
 */
function loadPDF() {
    const pdfPath = getPDFPath();
    console.log(`Loading PDF from: ${pdfPath}`);
    
    // Configure PDF.js with high-quality rendering settings
    const loadingTask = pdfjsLib.getDocument({
        url: pdfPath,
        withCredentials: false,
        httpHeaders: {
            'Accept': 'application/pdf'
        },
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true,
        // Enable high-quality rendering
        verbosity: 0, // Reduce console output
        disableAutoFetch: false,
        disableStream: false
    });
    
    loadingTask.promise.then(function(pdf) {
        console.log('PDF loaded successfully. Total pages:', pdf.numPages);
        pdfDoc = pdf;
        showViewer();
        // Auto fit to width on initial load for better readability
        // Use a slightly larger scale for better readability
        setTimeout(() => {
            onFitWidth();
            // If the fit width scale is too small, use a minimum scale
            if (scale < 1.0) {
                scale = 1.0;
                updateZoomLevel();
                queueRenderPage(pageNum);
            }
        }, 100);
    }).catch(function(error) {
        console.error('Failed to load PDF:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('PDF path attempted:', pdfPath);
        // Show file selector when URL loading fails
        if (pdfFileInput && selectPdfBtn) {
            pdfFileInput.style.display = 'block';
            selectPdfBtn.style.display = 'inline-block';
        }
        showError(error);
    });
}

// Event listeners
prevBtn.addEventListener('click', onPrevPage);
nextBtn.addEventListener('click', onNextPage);
zoomOutBtn.addEventListener('click', onZoomOut);
zoomInBtn.addEventListener('click', onZoomIn);
fitWidthBtn.addEventListener('click', onFitWidth);

// File input event listeners
if (selectPdfBtn && pdfFileInput) {
    selectPdfBtn.addEventListener('click', function() {
        pdfFileInput.click();
    });
    
    pdfFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            loadPDFFromFile(file);
        }
    });
}

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
    // Check if PDF.js is loaded
    if (typeof pdfjsLib === 'undefined') {
        console.error('PDF.js library not loaded!');
        showError({ name: 'LibraryError', message: 'PDF.js library failed to load. Please check your internet connection.' });
        return;
    }
    
    // Wait a bit to ensure PDF.js is fully initialized
    setTimeout(function() {
        loadPDF();
    }, 100);
});
