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

/* Render page (fixed scale) */
function renderPage(num) {
  pdfDoc.getPage(num).then(page => {
    const scale = 1.2; // fixed zoom level
    const viewport = page.getViewport({ scale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderCtx = {
      canvasContext: ctx,
      viewport
    };

    page.render(renderCtx);
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

    // Native share (mobile)
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

    // Fallback for WhatsApp Web
    const imgURL = URL.createObjectURL(blob);
    const text = encodeURIComponent(
      `Hi, I'm interested in this product (Page ${pageNum}). Screenshot attached.`
    );

    // Download screenshot first
    const a = document.createElement('a');
    a.href = imgURL;
    a.download = `Page_${pageNum}.png`;
    a.click();

    // Then open WhatsApp chat
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank");
  });
});
