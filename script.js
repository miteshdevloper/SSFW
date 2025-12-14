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
const gotoInput = document.getElementById('gotoPageInput');
const gotoBtn = document.getElementById('gotoPageBtn');

/* WhatsApp number (country code, no +) */
const WHATSAPP_NUMBER = "919425311374";

/* State */
let pdfDoc = null;
let totalPages = 0;
let pageNum = parseInt(localStorage.getItem('lastPage'), 10) || 1;
let isRendering = false;

/* Inactivity reset (2 min) */
const INACTIVITY_LIMIT = 2 * 60 * 1000;
let inactivityTimer;

/* Reset to first page */
function resetToFirstPage() {
  pageNum = 1;
  localStorage.setItem('lastPage', 1);
  renderPage(1);
}

/* Reset inactivity timer */
function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => resetToFirstPage(), INACTIVITY_LIMIT);
}

/* Render page with fade effect */
async function renderPage(num) {
  if (isRendering) return;
  isRendering = true;
  canvas.style.opacity = "0";

  const page = await pdfDoc.getPage(num);
  const scale = 1.2;
  const viewport = page.getViewport({ scale });

  const offscreen = document.createElement("canvas");
  const offCtx = offscreen.getContext("2d");
  offscreen.width = viewport.width;
  offscreen.height = viewport.height;

  await page.render({ canvasContext: offCtx, viewport }).promise;

  canvas.width = offscreen.width;
  canvas.height = offscreen.height;
  ctx.drawImage(offscreen, 0, 0);

  indicator.textContent = `${num} / ${totalPages}`;
  localStorage.setItem('lastPage', num);

  setTimeout(() => {
    canvas.style.opacity = "1";
    isRendering = false;
  }, 100);

  resetInactivityTimer();
}

/* Load PDF */
pdfjsLib.getDocument(url).promise.then(pdf => {
  pdfDoc = pdf;
  totalPages = pdf.numPages;
  gotoInput.max = totalPages;
  if (pageNum > totalPages) pageNum = 1;

  const alreadyShown = sessionStorage.getItem('splashShown');
  if (!alreadyShown) {
    splash.style.display = 'flex';
    viewer.classList.add('hidden');

    setTimeout(() => {
      splash.style.display = 'none';
      viewer.classList.remove('hidden');
      renderPage(pageNum);
      sessionStorage.setItem('splashShown', 'true');
    }, 2000); // 2 s splash
  } else {
    splash.style.display = 'none';
    viewer.classList.remove('hidden');
    renderPage(pageNum);
  }
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

/* Go-to-page */
gotoBtn.onclick = () => {
  const target = parseInt(gotoInput.value, 10);
  if (!isNaN(target) && target >= 1 && target <= totalPages) {
    pageNum = target;
    renderPage(pageNum);
  } else {
    alert(`Enter a number between 1 and ${totalPages}`);
  }
};

/* Keyboard navigation */
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') prevBtn.click();
  if (e.key === 'ArrowRight') nextBtn.click();
  resetInactivityTimer();
});

/* Swipe (mobile) */
let startX = 0, endX = 0;
const swipeThreshold = 50;
canvas.addEventListener('touchstart', e => {
  startX = e.touches[0].clientX;
  resetInactivityTimer();
});
canvas.addEventListener('touchmove', e => {
  endX = e.touches[0].clientX;
});
canvas.addEventListener('touchend', () => {
  const diff = endX - startX;
  if (Math.abs(diff) > swipeThreshold) {
    if (diff < 0 && pageNum < totalPages) { pageNum++; renderPage(pageNum); }
    else if (diff > 0 && pageNum > 1) { pageNum--; renderPage(pageNum); }
  }
  startX = endX = 0;
});

/* Reset timer on clicks / mouse moves */
['click', 'mousemove', 'keydown', 'touchstart'].forEach(evt =>
  document.addEventListener(evt, resetInactivityTimer)
);

/* WhatsApp share */
askBtn.addEventListener('click', () => {
  resetInactivityTimer();
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
