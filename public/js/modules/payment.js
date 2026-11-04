/**
 * Adem Ayem - Payment & Receipt Module
 * Modal pembayaran, kalkulasi kembalian, cetak struk, salin link, dan QR struk digital.
 */

let selectedPay = 'tunai';
let payingOrder = null;
let lastTrx = null;

const PAY_LABELS = {
  tunai: 'Tunai',
  qris: 'QRIS',
  transfer: 'Transfer Bank'
};

const PAY_ENUM = {
  tunai: 'cash',
  qris: 'qris',
  transfer: 'transfer'
};

function openPaymentModal() {
  if (!cart.length) {
    alert('Belum ada pesanan.');
    return;
  }
  selectedPay = 'tunai';
  document.getElementById('payModalTotal').textContent = rupiah(computeTotals().total);
  document.getElementById('cashReceived').value = '';
  selectPayModal('tunai');
  document.getElementById('paymentModal').style.display = 'flex';
}

function closePaymentModal() {
  const modal = document.getElementById('paymentModal');
  if (modal) modal.style.display = 'none';
}

function selectPayModal(m) {
  selectedPay = m;
  document.querySelectorAll('.paymethod-card').forEach(c => c.classList.toggle('sel', c.dataset.m === m));
  const cashSection = document.getElementById('cashSection');
  if (cashSection) cashSection.style.display = m === 'tunai' ? 'block' : 'none';
  updateChange();
}

function currentPayTotal() {
  return payingOrder ? payingOrder.total : computeTotals().total;
}

function setQuickAmt(v) {
  const total = currentPayTotal();
  document.getElementById('cashReceived').value = v === 'exact' ? total : v;
  updateChange();
}

function updateChange() {
  const total = currentPayTotal();
  const received = Number(document.getElementById('cashReceived')?.value) || 0;
  const change = received - total;
  const changeEl = document.getElementById('changeAmt');
  if (changeEl) changeEl.textContent = rupiah(change > 0 ? change : 0);
}

function closeReceiptModal() {
  const receiptModal = document.getElementById('receiptModal');
  if (receiptModal) receiptModal.style.display = 'none';
  const c = document.getElementById('custName');
  if (c) c.value = '';
}

function receiptRowsHTML(t) {
  const itemsHtml = (t.items || []).map(i =>
    `<div class="rline"><span>${escapeMenuHTML(i.name)}<br>&nbsp;&nbsp;${i.qty} x ${rupiah(i.price)}</span><span>${rupiah(i.price * i.qty)}</span></div>`
  ).join('');

  return `
    <div class="rline"><span>No. ${escapeMenuHTML(t.no)}</span><span>${new Date(t.date).toLocaleDateString('id-ID')} ${new Date(t.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span></div>
    <div class="rline"><span>Kasir: ${escapeMenuHTML(t.kasir || '-')}</span><span>${t.orderType === 'takeaway' ? 'Bawa pulang' : 'Makan di tempat'}</span></div>
    <div class="rline"><span>Pelanggan</span><span>${escapeMenuHTML(t.customer || '-')}</span></div>
    <hr>${itemsHtml}<hr>
    <div class="rline"><span>Subtotal</span><span>${rupiah(t.subtotal)}</span></div>
    ${t.discount > 0 ? `<div class="rline"><span>Diskon</span><span>- ${rupiah(t.discount)}</span></div>` : ''}
    <div class="rline"><span>PB1 10%</span><span>${rupiah(t.tax)}</span></div>
    <div class="rline"><b>TOTAL</b><b>${rupiah(t.total)}</b></div>
    <div class="rline"><span>${PAY_LABELS[t.payment] || t.payment}</span><span>${t.payment === 'tunai' ? rupiah(t.received) : '-'}</span></div>
    ${t.payment === 'tunai' ? `<div class="rline"><span>Kembali</span><span>${rupiah(t.change)}</span></div>` : ''}`;
}

// QR asli: berisi link ke halaman struk digital publik.
// Digambar manual dari data modul supaya selalu hitam di atas putih.
function buildReceiptQr(t) {
  if (typeof qrcode !== 'function' || !t || !t.receiptUrl) {
    return '<div style="font-size:12px;color:var(--muted);">QR belum tersedia</div>';
  }
  const qr = qrcode(0, 'M');
  qr.addData(t.receiptUrl);
  qr.make();

  const n = qr.getModuleCount();
  const cell = 5, quiet = 2;
  const size = (n + quiet * 2) * cell;
  let rects = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.isDark(r, c)) {
        rects += `<rect x="${(c + quiet) * cell}" y="${(r + quiet) * cell}" width="${cell}" height="${cell}" fill="#000"/>`;
      }
    }
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" style="display:block;margin:0 auto;background:#fff;">`
    + `<rect width="${size}" height="${size}" fill="#fff"/>${rects}</svg>`;
}

function openReceiptModal(t) {
  const bodyEl = document.getElementById('receiptModalBody');
  if (bodyEl) {
    bodyEl.innerHTML = `
      <div style="text-align:center"><b>ADEM AYEM</b><br><span style="font-size:11px;color:var(--muted)">Jl. Contoh No. 1, Kotamu</span></div>
      <hr>${receiptRowsHTML(t)}<hr>
      <div style="text-align:center;font-size:11.5px;">Terima kasih atas kunjungan Anda<br>Simpan struk ini sebagai bukti</div>`;
  }

  const qrEl = document.getElementById('fakeQr');
  if (qrEl) {
    qrEl.innerHTML = buildReceiptQr(t) + `<div style="font-size:11px;color:var(--muted);margin-top:4px;">scan untuk struk digital</div>`;
  }

  const receiptModal = document.getElementById('receiptModal');
  if (receiptModal) receiptModal.style.display = 'flex';
}

function copyReceiptLink(btn) {
  if (!lastTrx || !lastTrx.receiptUrl) return;
  const done = () => {
    if (!btn) return;
    const old = btn.textContent;
    btn.textContent = 'Link tersalin';
    setTimeout(() => { btn.textContent = old; }, 1500);
  };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(lastTrx.receiptUrl).then(done);
    return;
  }
  const ta = document.createElement('textarea');
  ta.value = lastTrx.receiptUrl;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  ta.remove();
  done();
}

function printLastReceipt() {
  if (!lastTrx) return;
  const printEl = document.getElementById('receiptPrint');
  if (printEl) {
    printEl.innerHTML = `
      <div class="receipt">
        <div class="center"><b>ADEM AYEM</b><br><span style="font-size:10.5px;">Jl. Contoh No. 1, Kotamu</span></div>
        <hr>${receiptRowsHTML(lastTrx)}<hr>
        <div class="center" style="margin-bottom:8px;">Terima kasih atas kunjungan Anda<br>Simpan struk ini sebagai bukti</div>
        <div class="center">${buildReceiptQr(lastTrx)}</div>
        <div class="center" style="font-size:10.5px;margin-top:4px;">scan untuk struk digital</div>
      </div>`;
  }
  document.body.classList.add('print-receipt-mode');
  window.print();
}

window.addEventListener('afterprint', () => document.body.classList.remove('print-receipt-mode'));