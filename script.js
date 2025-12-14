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

/* WhatsApp number (country code, no +) */
const WHATSAPP_NUMBER = "919425311374";

/* State */
let pdfDoc = null;
let totalPages = 0;
let pageNum = parseInt(localStorage.getItem('lastPage'), 10) || 1;

/* Render page */
function renderPage(num) {
  pdfDoc.getPage(num).then(page => {
    const baseViewport = page.getViewport({ scale: 1 });

    const scale = Math.min(
      window.innerWidth / baseViewport.width,
      window.innerHeight / baseViewport.height
    );

    const viewport = page.getViewport({ scale });

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

/* Resize handling */
window.addEventListener('resize', () => {
  if (pdfDoc) renderPage(pageNum);
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
    const file = new File([blob], `SSFW_Page_${pageNum}.png`, {
      type: "image/png"
    });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "SSFW Product",
          text: `Interested in this product (Page ${pageNum})`
        });
      } catch (_) {}
    } else {
      const text = encodeURIComponent(
        `Hi, I’m interested in this product.\nPage: ${pageNum}`
      );
      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`,
        "_blank"
      );
    }
  });
});

