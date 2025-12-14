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
let isRendering = false;

/* Add smooth fade transition */
canvas.style.transition = "opacity 0.4s ease";

/* Render page with smooth transition */
async function renderPage(num) {
  if (isRendering) return;
  isRendering = true;

  // Fade out current page
  canvas.style.opacity = "0";

  const page = await pdfDoc.getPage(num);
  const scale = 1.2;
  const viewport = page.getViewport({ scale });

  // Render offscreen first to avoid flicker
  const offscreenCanvas = document.createElement("canvas");
  const offscreenCtx = offscreenCanvas.getContext("2d");
  offscreenCanvas.width = viewport.width;
  offscreenCanvas.height = viewport.height;

  await page.render({
    canvasContext: offscreenCtx,
    viewport
  }).promise;

  // Once rendered, draw onto main canvas
  canvas.width = offscreenCanvas.width;
  canvas.height = offscreenCanvas.height;
  ctx.drawImage(offscreenCanvas, 0, 0);

  indicator.textContent = `${num} / ${totalPages}`;
  localStorage.setItem('lastPage', num);

  // Fade in new page
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

/* Swipe support */
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

/* WhatsApp share */
askBtn.addEventListener('click', () => {
  canvas.toBlob(async blob => {
    const file = new File([blob], `Page_${pageNum}.png`, { type: "image/png" });

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

    const imgURL = URL.createObjectURL(blob);
    const text = encodeURIComponent(
      `Hi, I'm interested in this product (Page ${pageNum}). Screenshot attached.`
    );

    const a = document.createElement('a');
    a.href = imgURL;
    a.download = `Page_${pageNum}.png`;
    a.click();

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank");
  });
});
