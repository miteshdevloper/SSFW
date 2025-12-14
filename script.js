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
const gotoInput = document.getElementById('gotoPageInput');
const gotoBtn = document.getElementById('gotoPageBtn');

/* WhatsApp */
const WHATSAPP_NUMBER = "919425311374";

/* State */
let pdfDoc = null;
let totalPages = 0;
let pageNum = 1;
let isRendering = false;

/* Auto-reset timer (2 min) */
const INACTIVITY_LIMIT = 2 * 60 * 1000;
let inactivityTimer;

/* Smooth fade */
canvas.style.transition = "opacity 0.4s ease";

/* Reset to first page */
function resetToFirstPage() {
  pageNum = 1;
  renderPage(1);
}

/* Restart inactivity timer */
function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(resetToFirstPage, INACTIVITY_LIMIT);
}

/* Render page */
async function renderPage(num) {
  if (isRendering) return;
  isRendering = true;
  canvas.style.opacity = "0";

  const page = await pdfDoc.getPage(num);
  const scale = Math.min(
    window.innerWidth / page.getViewport({ scale: 1 }).width,
    window.innerHeight / page.getViewport({ scale: 1 }).height
  );

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

  // Always start from page 1
  pageNum = 1;

  // Show splash only once
  const alreadyShown = sessionStorage.getItem('splashShown');
  if (!alreadyShown) {
    splash.style.display = 'flex';
    viewer.classList.add('hidden');
    setTimeout(() => {
      splash.style.display = 'none';
      viewer.classList.remove('hidden');
      renderPage(1);
      sessionStorage.setItem('splashShown', 'true');
      openFullscreen();
    }, 2000);
  } else {
    splash.style.display = 'none';
    viewer.classList.remove('hidden');
    renderPage(1);
    openFullscreen();
  }
});

/* Fullscreen helper */
function openFullscreen() {
  const elem = document.documentElement;
  if (elem.requestFullscreen) elem.requestFullscreen();
  else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
  else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
}

/* Controls */
prevBtn.onclick = () => { if (pageNum > 1) renderPage(--pageNum); };
nextBtn.onclick = () => { if (pageNum < totalPages) renderPage(++pageNum); };

gotoBtn.onclick = () => {
  const target = parseInt(gotoInput.value, 10);
  if (!isNaN(target) && target >= 1 && target <= totalPages) {
    pageNum = target;
    renderPage(pageNum);
  } else {
    alert(`Enter a number between 1 and ${totalPages}`);
  }
};

/* Keyboard nav */
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') prevBtn.click();
  if (e.key === 'ArrowRight') nextBtn.click();
  resetInactivityTimer();
});

/* Swipe (mobile) */
let startX = 0, endX = 0;
canvas.addEventListener('touchstart', e => {
  startX = e.touches[0].clientX;
  resetInactivityTimer();
});
canvas.addEventListener('touchmove', e => (endX = e.touches[0].clientX));
canvas.addEventListener('touchend', () => {
  const diff = endX - startX;
  if (Math.abs(diff) > 50) {
    if (diff < 0 && pageNum < totalPages) renderPage(++pageNum);
    else if (diff > 0 && pageNum > 1) renderPage(--pageNum);
  }
  startX = endX = 0;
});

/* Reset timer on user actions */
["click", "mousemove", "keydown", "touchstart"].forEach(evt =>
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
    const a = document.createElement("a");
    a.href = imgURL;
    a.download = `Page_${pageNum}.png`;
    a.click();
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank");
  });
});
