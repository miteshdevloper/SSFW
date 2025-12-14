const url = 'product.pdf';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

/* DOM */
const canvas = document.getElementById('pdf-canvas');
const ctx = canvas.getContext('2d');
const img = document.getElementById('pdf-image');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const indicator = document.getElementById('page-indicator');
const splash = document.getElementById('splash');
const viewer = document.querySelector('.viewer');
const askBtn = document.getElementById('askBtn');

const WHATSAPP_NUMBER = "919425311374";

/* State */
let pdfDoc = null;
let totalPages = 0;
let pageNum = parseInt(localStorage.getItem('lastPage'), 10) || 1;

/* Render page → image */
function renderPage(num) {
  pdfDoc.getPage(num).then(page => {
    const baseViewport = page.getViewport({ scale: 1 });

    const scale = Math.max(
      window.innerWidth / baseViewport.width,
      window.innerHeight / baseViewport.height
    );

    const viewport = page.getViewport({ scale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    page.render({ canvasContext: ctx, viewport }).promise.then(() => {
      img.src = canvas.toDataURL("image/png");
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
    renderPage(pageNum);
  }
};

nextBtn.onclick = () => {
  if (pageNum < totalPages) {
    pageNum++;
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

/* WhatsApp: attach image (NOT auto-send) */
askBtn.addEventListener('click', () => {
  canvas.toBlob(blob => {
    const file = new File([blob], `SSFW_Page_${pageNum}.png`, {
      type: "image/png"
    });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({
        files: [file],
        title: "SSFW Product",
        text: `Interested in this product (Page ${pageNum})`
      });
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
