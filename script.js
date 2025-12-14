const url = 'product.pdf';

/* PDF.js worker */
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

/* DOM */
const canvas = document.getElementById('pdf-canvas');
const ctx = canvas.getContext('2d');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const indicator = document.getElementById('page-indicator');
const splash = document.getElementById('splash');
const viewer = document.querySelector('.viewer');
const askBtn = document.getElementById('askBtn');

/* WhatsApp number */
const WHATSAPP_NUMBER = "919425311374";

/* State */
let pdfDoc = null;
let totalPages = 0;
let pageNum = parseInt(localStorage.getItem('lastPage'), 10) || 1;

/* Zoom */
let zoom = 1;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

/* Render page */
function renderPage(num) {
  pdfDoc.getPage(num).then(page => {
    const baseViewport = page.getViewport({ scale: 1 });

    const fitScale = Math.max(
      window.innerWidth / baseViewport.width,
      window.innerHeight / baseViewport.height
    );

    const finalScale = fitScale * zoom;
    const viewport = page.getViewport({ scale: finalScale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    page.render({
      canvasContext: ctx,
      viewport
    });

    indicator.textContent = `${num} / ${totalPages}`;
    localStorage.setItem('lastPage', num);
  });
}

/* Load PDF */
pdfjsLib.getDocument(url).promise.then(pdf => {
  pdfDoc = pdf;
  totalPages = pdf.numPages;
  if (pageNum > totalPages) pageNum = 1;

  setTimeout(() => {
    splash.style.display = 'none';
    viewer.classList.remove('hidden');
    renderPage(pageNum);
  }, 1800);
});

/* Navigation */
prevBtn.onclick = () => {
  if (pageNum > 1) {
    pageNum--;
    zoom = 1;
    renderPage(pageNum);
  }
};

nextBtn.onclick = () => {
  if (pageNum < totalPages) {
    pageNum++;
    zoom = 1;
    renderPage(pageNum);
  }
};

/* Keyboard */
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') prevBtn.click();
  if (e.key === 'ArrowRight') nextBtn.click();
});

/* Resize */
window.addEventListener('resize', () => {
  if (pdfDoc) renderPage(pageNum);
});

/* Swipe navigation */
let startX = 0;
let endX = 0;
const swipeThreshold = 50;

canvas.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    startX = e.touches[0].clientX;
  }
});

canvas.addEventListener('touchmove', e => {
  if (e.touches.length === 1) {
    endX = e.touches[0].clientX;
  }
});

canvas.addEventListener('touchend', () => {
  const diff = endX - startX;
  if (Math.abs(diff) > swipeThreshold && zoom === 1) {
    if (diff < 0 && pageNum < totalPages) nextBtn.click();
    if (diff > 0 && pageNum > 1) prevBtn.click();
  }
  startX = endX = 0;
});

/* Pinch-to-zoom */
let lastDistance = null;

canvas.addEventListener('touchmove', e => {
  if (e.touches.length === 2) {
    e.preventDefault();

    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const distance = Math.hypot(dx, dy);

    if (lastDistance) {
      zoom += (distance - lastDistance) * 0.005;
      zoom = Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM);
      renderPage(pageNum);
    }

    lastDistance = distance;
  }
}, { passive: false });

canvas.addEventListener('touchend', () => {
  lastDistance = null;
});

/* Double-tap zoom */
let lastTap = 0;

canvas.addEventListener('touchend', () => {
  const now = Date.now();
  if (now - lastTap < 300) {
    zoom = zoom === 1 ? 2 : 1;
    renderPage(pageNum);
  }
  lastTap = now;
});

/* WhatsApp (unchanged) */
askBtn.addEventListener('click', () => {
  canvas.toBlob(blob => {
    const file = new File([blob], `SSFW_Page_${pageNum}.png`, {
      type: "image/png"
    });

    const text = encodeURIComponent(
      `Hi, I’m interested in this product.\nPage: ${pageNum}`
    );

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`,
      "_blank"
    );

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({
        files: [file],
        title: "SSFW Product"
      });
    }
  });
});
