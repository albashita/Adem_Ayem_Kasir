/**
 * Adem Ayem - Riwayat Transaksi & Pembayaran Module
 * Mengelola filter transaksi, rincian pembayaran, pengurangan stok otomatis di backend,
 * pembatalan pesanan yang sudah dibayar, dan pencetakan struk transaksi.
 */

let histOrders = [];
let histFilter = 'semua';

// Gunakan variabel global payingOrder dan lastTrx yang sudah dideklarasikan di payment.js
if (typeof payingOrder === 'undefined') {
  window.payingOrder = null;
}
if (typeof lastTrx === 'undefined') {
  window.lastTrx = null;
}

const PAY_FROM_ENUM = {
  cash: 'tunai',
  qris: 'qris',
  transfer: 'transfer'
};

const PAY_METHOD_NAMES = {
  cash: 'Tunai',
  qris: 'QRIS',
  transfer: 'Transfer Bank',
  tunai: 'Tunai'
};

const CANCEL_REASON_LABEL = {
  customer_cancel:  'Pelanggan batal',
  wrong_input:      'Salah input',
  menu_unavailable: 'Menu habis',
  other:            'Lainnya'
};

let cancelingOrder = null;

// Helper modal alert
function triggerHistAlert(message, title = 'Perhatian') {
  const alertModal = document.getElementById('alertModal');
  const msgEl = document.getElementById('alertModalMsg');
  const titleEl = document.getElementById('alertModalTitle');
  if (alertModal && msgEl) {
    msgEl.textContent = message;
    if (titleEl) titleEl.textContent = title;
    alertModal.style.display = 'flex';
  } else {
    alert(message);
  }
}

if (typeof window.closeAlertModal !== 'function') {
  window.closeAlertModal = function () {
    const alertModal = document.getElementById('alertModal');
    if (alertModal) alertModal.style.display = 'none';
  };
}

async function loadHistory() {
  const page = document.getElementById('riwayatPage');
  if (!page) return;

  const body = document.getElementById('histBody');
  if (body) {
    body.innerHTML = '<tr><td colspan="8" class="empty">Memuat data transaksi...</td></tr>';
  }

  // Gunakan data-list-url dengan fallback ke path relatif yang aman
  const url = page.dataset.listUrl || '/riwayat/data';

  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (!res.ok) {
      let errorMsg = `Gagal memuat data transaksi (Kode: ${res.status})`;
      try {
        const errJson = await res.json();
        if (errJson && errJson.message) errorMsg = errJson.message;
      } catch (_) {}
      throw new Error(errorMsg);
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Sesi telah berakhir atau server mengembalikan format tidak valid. Silakan muat ulang halaman.');
    }

    const data = await res.json();
    histOrders = Array.isArray(data) ? data : (data.data || []);
    renderHistory();
  } catch (e) {
    console.error('[AdemAyem] Gagal memuat data transaksi:', e);
    if (body) {
      body.innerHTML = `<tr><td colspan="8" class="empty" style="color:var(--danger);padding:24px 12px;">${escapeMenuHTML(e.message || 'Terjadi kesalahan saat memuat data transaksi.')}</td></tr>`;
    }
  }
}

function setHistFilter(f) {
  histFilter = f;
  renderHistory();
}

function onDateFilterChange() {
  const fromEl = document.getElementById('fFrom');
  const toEl = document.getElementById('fTo');
  const fromVal = fromEl?.value || '';
  const toVal = toEl?.value || '';

  if (fromVal && toVal && fromVal > toVal) {
    triggerHistAlert('Tanggal awal tidak boleh melebihi tanggal akhir.', 'Filter Tanggal');
    toEl.value = fromVal;
  }

  renderHistory();
}

function resetHistFilter() {
  ['fSearch', 'fTipe', 'fMetode', 'fFrom', 'fTo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  setHistFilter('semua');
}

// yyyy-mm-dd waktu lokal
function histLocalDate(d) {
  if (!d) return '';
  const x = new Date(d);
  if (isNaN(x.getTime())) return '';
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return x.getFullYear() + '-' + m + '-' + day;
}

function getFilteredHistory() {
  const q = (document.getElementById('fSearch')?.value || '').trim().toLowerCase();
  const tipe = document.getElementById('fTipe')?.value || '';
  const metode = document.getElementById('fMetode')?.value || '';
  const from = document.getElementById('fFrom')?.value || '';
  const to = document.getElementById('fTo')?.value || '';

  return histOrders.filter(o => {
    // Filter status tab
    if (histFilter === 'belum' && o.status !== 'pending') return false;
    if (histFilter === 'sudah' && o.status !== 'completed') return false;
    if (histFilter === 'batal' && o.status !== 'cancelled') return false;

    // Filter tipe layanan
    if (tipe && o.service_type !== tipe) return false;

    // Filter metode pembayaran
    if (metode && (o.payment_method || '').toLowerCase() !== metode.toLowerCase()) {
      return false;
    }

    // Filter pencarian invoice atau pelanggan
    if (q) {
      const hay = ((o.no || '') + ' ' + (o.customer || '')).toLowerCase();
      if (!hay.includes(q)) return false;
    }

    // Filter rentang tanggal
    if (from || to) {
      const d = histLocalDate(o.date);
      if (from && d < from) return false;
      if (to && d > to) return false;
    }

    return true;
  });
}

function renderHistory() {
  document.querySelectorAll('#histTabs .cat-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.f === histFilter)
  );

  const histBody = document.getElementById('histBody');
  if (!histBody) return;

  const list = getFilteredHistory();

  if (!list.length) {
    const emptyMsg = histOrders.length
      ? 'Tidak ada transaksi yang sesuai dengan filter yang dipilih.'
      : 'Belum ada transaksi yang tercatat.';
    histBody.innerHTML = `<tr><td colspan="8" class="empty">${emptyMsg}</td></tr>`;
    return;
  }

  histBody.innerHTML = list.map(o => {
    const isTakeaway = o.service_type === 'takeaway';
    const isCompleted = o.status === 'completed';
    const isCancelled = o.status === 'cancelled';

    const serviceBadge = `<span class="badge ${isTakeaway ? 'badge-take' : 'badge-dine'}">${isTakeaway ? 'Bawa Pulang' : 'Makan di Tempat'}</span>`;

    const statusBadge = isCancelled
      ? `<span class="badge badge-unpaid" style="background:#fee2e2;color:#dc2626;">Dibatalkan</span>`
      : isCompleted
        ? `<span class="badge badge-paid">Sudah Bayar</span>`
        : `<span class="badge badge-unpaid">Menunggu Pembayaran</span>`;

    const methodLabel = (isCompleted || isCancelled) && o.payment_method
      ? `<span class="pay-method-badge">${PAY_METHOD_NAMES[o.payment_method] || escapeMenuHTML(o.payment_method)}</span>`
      : `<span style="color:var(--muted);">-</span>`;

    const actionBtn = isCancelled
      ? `<span style="color:var(--muted);font-size:12px;" title="${escapeMenuHTML(o.cancel_note || '')}">${CANCEL_REASON_LABEL[o.cancel_reason] || '-'}</span>`
      : isCompleted
        ? `<div style="display:flex;gap:6px;justify-content:center;">
             <button class="btn btn-outline btn-compact" onclick="showOrderReceipt(${o.id})" title="Lihat struk pembayaran">Struk</button>
             <button class="btn btn-compact" style="background:#fff5f5;border:1px solid #fca5a5;color:#dc2626;" onclick="openCancelOrder(${o.id})" title="Batalkan pesanan ini">Batalkan</button>
           </div>`
        : `<button class="btn btn-primary btn-compact" onclick="openPayOrder(${o.id})" title="Proses pembayaran pesanan ini">Bayar</button>`;

    const dateFormatted = new Date(o.date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <tr>
        <td style="white-space:nowrap;font-size:12.5px;">${dateFormatted}</td>
        <td style="font-weight:600;font-family:monospace;letter-spacing:0.5px;">${escapeMenuHTML(o.no)}</td>
        <td>${escapeMenuHTML(o.customer || 'Umum')}</td>
        <td>${serviceBadge}</td>
        <td style="font-weight:700;color:var(--brand);font-variant-numeric:tabular-nums;${isCancelled ? 'text-decoration:line-through;opacity:.6;' : ''}">${rupiah(o.total)}</td>
        <td>${methodLabel}</td>
        <td>${statusBadge}</td>
        <td class="row-actions" style="text-align:center;">${actionBtn}</td>
      </tr>
    `;
  }).join('');
}

function histToTrx(o) {
  return {
    id: o.id,
    no: o.no,
    date: o.date,
    items: o.items || [],
    subtotal: o.subtotal || 0,
    discount: o.discount || 0,
    tax: o.tax || 0,
    total: o.total || 0,
    payment: PAY_FROM_ENUM[o.payment_method] || o.payment_method || 'tunai',
    received: o.received ?? o.total,
    change: o.change ?? 0,
    kasir: (typeof currentUser === 'function' && currentUser()) ? currentUser().name : (typeof SERVER_USER !== 'undefined' ? SERVER_USER.name : 'Kasir'),
    customer: o.customer || 'Umum',
    orderType: o.service_type || 'dine-in',
    receiptUrl: o.receipt_url || ''
  };
}

function showOrderReceipt(id) {
  const o = histOrders.find(x => x.id === id);
  if (!o) return;
  lastTrx = histToTrx(o);
  openReceiptModal(lastTrx);
}

function openPayOrder(id) {
  payingOrder = histOrders.find(o => o.id === id);
  if (!payingOrder) return;

  // Isi data tagihan di kartu rincian modal
  const invEl = document.getElementById('payBillInvoice');
  if (invEl) invEl.textContent = payingOrder.no;

  const custEl = document.getElementById('payBillCustomer');
  if (custEl) custEl.textContent = payingOrder.customer || 'Umum';

  const typeEl = document.getElementById('payBillType');
  if (typeEl) {
    typeEl.textContent = payingOrder.service_type === 'takeaway' ? 'Bawa Pulang' : 'Makan di Tempat';
  }

  const subEl = document.getElementById('payBillSubtotal');
  if (subEl) subEl.textContent = rupiah(payingOrder.subtotal || payingOrder.total);

  const discRow = document.getElementById('payBillDiscRow');
  const discEl = document.getElementById('payBillDiscount');
  if (discRow && discEl) {
    if (payingOrder.discount > 0) {
      discRow.style.display = 'flex';
      discEl.textContent = '- ' + rupiah(payingOrder.discount);
    } else {
      discRow.style.display = 'none';
    }
  }

  const totalEl = document.getElementById('payModalTotal');
  if (totalEl) totalEl.textContent = rupiah(payingOrder.total);

  const cashRec = document.getElementById('cashReceived');
  if (cashRec) cashRec.value = '';

  selectPayModal('tunai');
  document.getElementById('paymentModal').style.display = 'flex';
}

async function confirmPayOrder() {
  if (!payingOrder) return;
  const total = payingOrder.total;
  let received = null;
  let change = 0;

  if (selectedPay === 'tunai') {
    received = Number(document.getElementById('cashReceived')?.value) || 0;
    if (received < total) {
      triggerHistAlert('Jumlah uang yang diterima kurang dari total tagihan (' + rupiah(total) + ').', 'Nominal Kurang');
      return;
    }
    change = received - total;
  }

  const btn = document.getElementById('payConfirmBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Memproses Pembayaran...';
  }

  try {
    const page = document.getElementById('riwayatPage');
    const base = page?.dataset.payUrl || '/riwayat';
    const res = await fetch(base + '/' + payingOrder.id + '/pay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': CSRF_TOKEN,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        payment_method: PAY_ENUM[selectedPay] || 'cash',
        received: selectedPay === 'tunai' ? received : total
      })
    });

    const data = await res.json();
    if (!res.ok) {
      const errorMsg = data.errors ? Object.values(data.errors)[0][0] : (data.message || 'Gagal memproses pembayaran.');
      triggerHistAlert(errorMsg, 'Gagal');
      return;
    }

    lastTrx = {
      ...histToTrx(payingOrder),
      payment: selectedPay,
      received: selectedPay === 'tunai' ? received : total,
      change: change
    };

    closePaymentModal();
    openReceiptModal(lastTrx);

    // Muat ulang data riwayat
    await loadHistory();

    // Jika sedang membuka kasir di tab lain / ada function refreshStockEstimates, panggil
    if (typeof refreshStockEstimates === 'function') {
      refreshStockEstimates();
    }

  } catch (e) {
    console.error(e);
    triggerHistAlert('Terjadi kesalahan jaringan: ' + e.message, 'Gagal');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Konfirmasi & Cetak Struk';
    }
  }
}

// ─── Batalkan pesanan yang sudah dibayar ─────────────────────────────────────
function openCancelOrder(id) {
  cancelingOrder = histOrders.find(o => o.id === id);
  if (!cancelingOrder) return;

  document.getElementById('cancelOrderInfo').textContent =
    `${cancelingOrder.no} · ${cancelingOrder.customer || 'Umum'} · ${rupiah(cancelingOrder.total)}`;
  document.getElementById('cancelReason').value = 'customer_cancel';
  document.getElementById('cancelNote').value = '';
  document.getElementById('cancelRefund').value =
    cancelingOrder.payment_method === 'cash' ? 'cash' : 'transfer';
  document.getElementById('cancelRestoreStock').value = '1';
  document.getElementById('cancelOrderError').textContent = '';
  document.getElementById('cancelOrderModal').style.display = 'flex';
}

function closeCancelOrder() {
  document.getElementById('cancelOrderModal').style.display = 'none';
  cancelingOrder = null;
}

async function confirmCancelOrder() {
  if (!cancelingOrder) return;

  const reason  = document.getElementById('cancelReason').value;
  const note    = document.getElementById('cancelNote').value.trim();
  const refund  = document.getElementById('cancelRefund').value;
  const restore = document.getElementById('cancelRestoreStock').value === '1';
  const errEl   = document.getElementById('cancelOrderError');
  const btn     = document.getElementById('cancelConfirmBtn');

  errEl.textContent = '';
  if (reason === 'other' && !note) {
    errEl.textContent = 'Keterangan wajib diisi untuk alasan "Lainnya".';
    return;
  }

  btn.disabled = true;
  try {
    const page = document.getElementById('riwayatPage');
    const base = page?.dataset.payUrl || '/riwayat';
    const res = await fetch(base + '/' + cancelingOrder.id + '/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': CSRF_TOKEN,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        reason,
        note: note || null,
        refund_method: refund,
        restore_stock: restore
      })
    });

    const data = await res.json();
    if (!res.ok) {
      errEl.textContent = data.errors
        ? Object.values(data.errors).flat().join('\n')
        : (data.message || 'Gagal membatalkan pesanan.');
      return;
    }

    closeCancelOrder();
    await loadHistory();
    triggerHistAlert(data.message || 'Pesanan berhasil dibatalkan.', 'Berhasil');

    if (typeof refreshStockEstimates === 'function') {
      refreshStockEstimates();
    }
  } catch (e) {
    errEl.textContent = 'Terjadi kesalahan jaringan: ' + e.message;
  } finally {
    btn.disabled = false;
  }
}

// Ekspor ke window agar dapat dipanggil dari app.js / core.js
window.loadHistory = loadHistory;
window.renderHistory = renderHistory;
window.setHistFilter = setHistFilter;
window.resetHistFilter = resetHistFilter;
window.onDateFilterChange = onDateFilterChange;
window.openPayOrder = openPayOrder;
window.confirmPayOrder = confirmPayOrder;
window.showOrderReceipt = showOrderReceipt;
window.openCancelOrder = openCancelOrder;
window.closeCancelOrder = closeCancelOrder;
window.confirmCancelOrder = confirmCancelOrder;

// Cetak struk lewat iframe tersembunyi (hanya struk + QR yang tercetak)
document.addEventListener('DOMContentLoaded', function () {
  window.printLastReceipt = function () {
    const struk = document.getElementById('receiptModalBody');
    const qr = document.getElementById('fakeQr');
    if (!struk) return;

    const lama = document.getElementById('printFrame');
    if (lama) lama.remove();

    const f = document.createElement('iframe');
    f.id = 'printFrame';
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(f);

    const doc = f.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Struk Pembayaran</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  body { margin:0; padding:4mm; width:80mm; font-family:'Courier New',monospace; font-size:12px; color:#000; }
  .rline { display:flex; justify-content:space-between; padding:1px 0; }
  hr { border:none; border-top:1px dashed #000; margin:6px 0; }
  .center { text-align:center; }
  .qr { text-align:center; margin-top:10px; }
  .qr img, .qr svg, .qr canvas { width:36mm; height:auto; }
</style>
</head>
<body>
  ${struk.innerHTML}
  <div class="qr">${qr ? qr.innerHTML : ''}</div>
</body>
</html>`);
    doc.close();

    setTimeout(function () {
      f.contentWindow.focus();
      f.contentWindow.print();
    }, 300);
  };
});