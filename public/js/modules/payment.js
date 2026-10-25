/**
 * Adem Ayem - Payment & Receipt Module
 * Modal pembayaran, kalkulasi kembalian, cetak struk, WhatsApp, dan QR struk digital.
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

function receiptLinesText(t) {
  const itemLines = (t.items || []).map(i => `${i.name} x${i.qty}  ${rupiah(i.price * i.qty)}`).join('\n');
  let s = `ADEM AYEM\nNo. ${t.no}   ${new Date(t.date).toLocaleString('id-ID')}\nKasir: ${t.kasir || '-'}   ${t.orderType === 'takeaway' ? 'Bawa pulang' : 'Makan di tempat'}\nPelanggan: ${t.customer || '-'}\n---\n${itemLines}\n---\nSubtotal: ${rupiah(t.subtotal)}\n`;
  if (t.discount > 0) s += `Diskon: -${rupiah(t.discount)}\n`;
  s += `PB1 10%: ${rupiah(t.tax)}\nTOTAL: ${rupiah(t.total)}\nBayar: ${PAY_LABELS[t.payment] || t.payment}`;
  if (t.payment === 'tunai') s += `\nTunai: ${rupiah(t.received)}\nKembali: ${rupiah(t.change)}`;
  return s + `\nTerima kasih atas kunjungan Anda`;
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
    qrEl.innerHTML = buildFakeQr(t.no || 'STRUK') + `<div style="font-size:11px;color:var(--muted);margin-top:4px;">scan untuk struk digital</div>`;
  }

  const receiptModal = document.getElementById('receiptModal');
  if (receiptModal) receiptModal.style.display = 'flex';
}

function buildFakeQr(seed) {
  const size = 21, cell = 6;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  function rnd() { h = (h * 1664525 + 1013904223) >>> 0; return h; }
  function inFinder(x, y, cx, cy) {
    const lx = x - cx, ly = y - cy;
    if (lx < 0 || lx > 6 || ly < 0 || ly > 6) return null;
    if (lx === 0 || lx === 6 || ly === 0 || ly === 6) return true;
    if (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4) return true;
    return false;
  }
  let rects = '';
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let black = inFinder(x, y, 0, 0);
      if (black === null) black = inFinder(x, y, size - 7, 0);
      if (black === null) black = inFinder(x, y, 0, size - 7);
      if (black === null) black = (rnd() % 2 === 0);
      if (black) rects += `<rect x="${x * cell}" y="${y * cell}" width="${cell - 1}" height="${cell - 1}" fill="#1F2A24"/>`;
    }
  }
  const total = size * cell;
  return `<svg width="126" height="126" viewBox="0 0 ${total} ${total}" style="background:#fff;">${rects}</svg>`;
}

function sendWhatsApp() {
  if (!lastTrx) return;
  window.open('https://wa.me/?text=' + encodeURIComponent(receiptLinesText(lastTrx)), '_blank');
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
        <div class="center">${buildFakeQr(lastTrx.no || 'STRUK')}</div>
        <div class="center" style="font-size:10.5px;margin-top:4px;">scan untuk struk digital</div>
      </div>`;
  }
  document.body.classList.add('print-receipt-mode');
  window.print();
}

window.addEventListener('afterprint', () => document.body.classList.remove('print-receipt-mode'));
