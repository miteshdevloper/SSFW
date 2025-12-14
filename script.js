const url = 'product.pdf';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

const canvas = document.getElementById('pdf-canvas');
const ctx = canvas.getContext('2d');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const indicator = document.getElementById('page-indicator');
const splash = document.getElementById('splash');
const viewer = document.querySelector('.viewer');

let pdfDoc = null;
let pageNum = 1;
let totalPages = 0;

function renderPage(num) {
  pdfDoc.getPage(num).then(page => {
    const viewport = page.getViewport({ scale: 1 });
    const scale = Math.min(
      window.innerWidth / viewport.width,
      window.innerHeight / viewport.height
    );

    const scaledViewport = page.getViewport({ scale });

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    page.render({
      canvasContext: ctx,
      viewport: scaledViewport
    });

    indicator.textContent = `${num} / ${totalPages}`;
  });
}

pdfjsLib.getDocument(url).promise.then(pdf => {
  pdfDoc = pdf;
  totalPages = pdf.numPages;

  setTimeout(() => {
    splash.style.display = 'none';
    viewer.classList.remove('hidden');
    renderPage(pageNum);
  }, 1800);
});

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

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') prevBtn.click();
  if (e.key === 'ArrowRight') nextBtn.click();
});
let startX = 0;
let endX = 0;
const swipeThreshold = 50; // px

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

window.addEventListener('resize', () => renderPage(pageNum));
