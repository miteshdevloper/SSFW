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
const askBtn = document.getElementById('askBtn');
const gotoInput = document.getElementById('gotoPageInput');
const gotoBtn = document.getElementById('gotoPageBtn');

const WHATSAPP_NUMBER = "919425311374";

let pdfDoc = null;
let totalPages = 0;
let pageNum = 1;
let isRendering = false;
let inactivityTimer;
const INACTIVITY_LIMIT = 2 * 60 * 1000; // 2 min

/* Render page full-screen */
async function renderPage(num) {
  if (isRendering) return;
  isRendering = true;
  canvas.style.opacity = "0";

  const page = await pdfDoc.getPage(num);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = Math.min(
    window.innerWidth / baseViewport.width,
    window.innerHeight / baseViewport.height
  );
  const viewport = page.getViewport({ scale });

  const off = document.createElement("canvas");
  const offCtx = off.getContext("2d");
  off.width = viewport.width;
  off.height = viewport.height;
  await page.render({ canvasContext: offCtx, viewport }).promise;

  canvas.width = off.width;
  canvas.height = off.height;
  ctx.drawImage(off, 0, 0);

  indicator.textContent = `${num} / ${totalPages}`;
  setTimeout(() => (canvas.style.opacity = "1"), 100);

  isRendering = false;
  resetInactivityTimer();
}

/* Reset inactivity */
function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    pageNum = 1;
    renderPage(1);
  }, INACTIVITY_LIMIT);
}

/* Load PDF and start at page 1 */
pdfjsLib.getDocument(url).promise.then(pdf => {
  pdfDoc = pdf;
  totalPages = pdf.numPages;
  gotoInput.max = totalPages;
  renderPage(1);
  openFullscreen();
});

/* Fullscreen */
function openFullscreen() {
  const elem = document.documentElement;
  if (elem.requestFullscreen) elem.requestFullscreen();
  else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
}

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
gotoBtn.onclick = () => {
  const target = parseInt(gotoInput.value, 10);
  if (!isNaN(target) && target >= 1 && target <= totalPages) {
    pageNum = target;
    renderPage(pageNum);
  }
};

/* Reset timer on activity */
["click", "mousemove", "keydown", "touchstart"].forEach(evt =>
  document.addEventListener(evt, resetInactivityTimer)
);

/* WhatsApp share (Hindi label) */
askBtn.addEventListener('click', () => {
  resetInactivityTimer();
  canvas.toBlob(async blob => {
    const file = new File([blob], `पेज_${pageNum}.png`, { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "SSFW Product",
          text: `मैं इस उत्पाद में रुचि रखता हूँ (पेज ${pageNum}).`
        });
        return;
      } catch (_) {}
    }

    const text = encodeURIComponent(
      `नमस्ते, मैं इस उत्पाद में रुचि रखता हूँ। (पेज ${pageNum})`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank");
  });
});
