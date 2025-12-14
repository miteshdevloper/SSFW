const url = 'product.pdf';

/* PDF.js worker */
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

/* DOM elements */
const canvas = document.getElementById('pdf-canvas');
const ctx = canvas.getContext('2d');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const indicator = document.getElementById('page-indicator');
const splash = document.getElementById('splash');
const viewer = document.querySelector('.viewer');
const askBtn = document.getElementById('askBtn');

/* WhatsApp number (country code, no +) */
const WHATSAPP_NUMBER = "919425311374";

/* State */
let pdfDoc = null;
let totalPages = 0;
let pageNum = parseInt(localStorage.getItem('lastPage'), 10) || 1;
let isRendering = false;

/* Smooth fade transition */
canvas.style.transition = "opacity 0.4s ease";

/* Render page with fade effect */
async function renderPage(num) {
  if (isRendering) return;
  isRendering = true;

  canvas.style.opacity = "0";

  const page = await pdfDoc.getPage(num);
  const scale = 1.2; // fixed zoom level
  const viewport = page.getViewport({ scale });

  // Render offscreen to avoid flicker
  const offscreenCanvas = document.createElement("canvas");
  const offscreenCtx = offscreenCanvas.getContext("2d");
  offscreenCanvas.width = viewport.width;
  offscreenCanvas.height = viewport.height;

  await page.render({
    canvasContext: offscreenCtx,
    viewport
  }).promise;

  // Draw offscreen result onto visible canvas
  canvas.width = offscreenCanvas.width;
  canvas.height = offscreenCanvas.height;
  ctx.drawImage(offscreenCanvas, 0, 0);

  indicator.textContent = `${num} / ${totalPages}`;
  localStorage.setItem('lastPage', num);

  // Fade back in
  setTimeout(() => {
    canvas.style.opacity = "1";
    isRendering = false;
  }, 100);
}

/* Load PDF */
pdfjsLib.getDocument(url).promise.then(pdf => {
  pdfDoc = pdf;
  totalPages = pdf.numPages;

  if (pageNum > totalPages) pageNum = 1;

  const alreadyShown = sessionStorage.getItem('splashShown');

  if (!alreadyShown) {
    // Show splash only on first open
    splash.style.display = 'flex';
    viewer.classList.add('hidden');

    setTimeout(() => {
      splash.style.display = 'none';
      viewer.classList.remove('hidden');
      renderPage(pageNum);
      sessionStorage.setItem('splashShown', 'true');
    }, 1800);
  } else {
    // Skip splash after first time
    splash.style.display = 'none';
    viewer.classList.remove('hidden');
    renderPage(pageNum);
  }
});

/* Navigation buttons */
prevBtn.onclick = () => {
  if (pageNum > 1) {
    pageNum--;
    renderPage(pageNum);
  }
};

nextBtn.onclick = () => {
  if (pageNum < totalPages) {
    pageNum++;
    renderPage(pageNum);
  }
};

/* Keyboard navigation */
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') prevBtn.click();
  if (e.key === 'ArrowRight') nextBtn.click();
});

/* Swipe support (mobile) */
let startX = 0;
let endX = 0;
const swipeThreshold = 50;

canvas.addEventListener('touchstart', e => {
  startX = e.touches[0].clientX;
});

canvas.addEventListener('touchmove', e => {
  endX = e.touches[0].clientX;
});

canvas.addEventListener('touchend', () => {
  const diff = endX - startX;
  if (Math.abs(diff) > swipeThreshold) {
    if (diff < 0 && pageNum < totalPages) {
      pageNum++;
      renderPage(pageNum);
    } else if (diff > 0 && pageNum > 1) {
      pageNum--;
      renderPage(pageNum);
    }
  }
  startX = endX = 0;
});

/* WhatsApp Share */
askBtn.addEventListener('click', () => {
  canvas.toBlob(async blob => {
    const file = new File([blob], `Page_${pageNum}.png`, { type: "image/png" });

    // Try native share first (mobile)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "SSFW Product",
          text: `Hi, I'm interested in this product (Page ${pageNum}).`
        });
        return;
      } catch (err) {
        console.error("Share cancelled or failed:", err);
      }
    }

    // Fallback for desktop / WhatsApp Web
    const imgURL = URL.createObjectURL(blob);
    const text = encodeURIComponent(
      `Hi, I'm interested in this product (Page ${pageNum}). Screenshot attached.`
    );

    // Auto-download screenshot for user to attach manually
    const a = document.createElement('a');
    a.href = imgURL;
    a.download = `Page_${pageNum}.png`;
    a.click();

    // Open WhatsApp chat
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank");
  });
});
