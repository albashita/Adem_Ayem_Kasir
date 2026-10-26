/**
 * Adem Ayem - Riwayat Transaksi Module
 */

let histOrders = [];
let histFilter = 'semua';
const PAY_FROM_ENUM = { cash: 'tunai', qris: 'qris', transfer: 'transfer' };

async function loadHistory() {
  const page = document.getElementById('riwayatPage');
  if (!page) return;

  try {
    const res = await fetch(page.dataset.listUrl, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('Gagal memuat riwayat.');
    histOrders = await res.json();
  } catch (e) {
    const body = document.getElementById('histBody');
    if (body) body.innerHTML = '<tr><td colspan="7" class="empty">' + escapeMenuHTML(e.message) + '</td></tr>';
    return;
  }
  renderHistory();
}

function setHistFilter(f) {
  histFilter = f;
  renderHistory();
}

function resetHistFilter() {
  ['fSearch', 'fTipe', 'fFrom', 'fTo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  setHistFilter('semua');
}

// yyyy-mm-dd menurut waktu lokal (aman dari geseran timezone)
function histLocalDate(d) {
  const x = new Date(d);
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return x.getFullYear() + '-' + m + '-' + day;
}

function getFilteredHistory() {
  const q    = (document.getElementById('fSearch')?.value || '').trim().toLowerCase();
  const tipe = document.getElementById('fTipe')?.value || '';
  const from = document.getElementById('fFrom')?.value || '';
  const to   = document.getElementById('fTo')?.value || '';

  return histOrders.filter(o => {
    if (histFilter === 'belum' && o.status !== 'pending') return false;
    if (histFilter === 'sudah' && o.status !== 'completed') return false;

    if (tipe && o.service_type !== tipe) return false;

    if (q) {
      const hay = ((o.no || '') + ' ' + (o.customer || '')).toLowerCase();
      if (!hay.includes(q)) return false;
    }

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

  histBody.innerHTML = list.length ? list.map(o => {
    const take = o.service_type === 'takeaway';
    const st = o.status === 'completed'
      ? ['badge-paid', 'Sudah bayar']
      : o.status === 'pending'
        ? ['badge-unpaid', 'Belum bayar']
        : ['badge-unpaid', 'Dibatalkan'];

    const act = o.status === 'pending'
      ? `<button onclick="openPayOrder(${o.id})">Bayar</button>`
      : o.status === 'completed'
        ? `<button onclick="showOrderReceipt(${o.id})">Struk</button>`
        : '-';

    return `<tr>
      <td>${new Date(o.date).toLocaleString('id-ID')}</td>
      <td>${escapeMenuHTML(o.no)}</td>
      <td>${escapeMenuHTML(o.customer)}</td>
      <td><span class="badge ${take ? 'badge-take' : 'badge-dine'}">${take ? 'Bawa Pulang' : 'Makan di Tempat'}</span></td>
      <td>${rupiah(o.total)}</td>
      <td><span class="badge ${st[0]}">${st[1]}</span></td>
      <td class="row-actions">${act}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="7" class="empty">${histOrders.length ? 'Tidak ada pesanan yang cocok' : 'Belum ada pesanan'}</td></tr>`;
}

function histToTrx(o) {
  return {
    id: o.id,
    no: o.no,
    date: o.date,
    items: o.items,
    subtotal: o.subtotal,
    discount: o.discount,
    tax: o.tax,
    total: o.total,
    payment: PAY_FROM_ENUM[o.payment_method] || null,
    received: o.received ?? o.total,
    change: o.change ?? 0,
    kasir: currentUser() ? currentUser().name : '-',
    customer: o.customer,
    orderType: o.service_type
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

  document.getElementById('payModalInfo').textContent = payingOrder.no + ' · ' + payingOrder.customer;
  document.getElementById('payModalTotal').textContent = rupiah(payingOrder.total);
  document.getElementById('cashReceived').value = '';
  selectPayModal('tunai');
  document.getElementById('paymentModal').style.display = 'flex';
}

async function confirmPayOrder() {
  if (!payingOrder) return;
  const total = payingOrder.total;
  let received = null;
  let change = 0;

  if (selectedPay === 'tunai') {
    received = Number(document.getElementById('cashReceived').value) || 0;
    if (received < total) {
      alert('Uang diterima kurang dari total.');
      return;
    }
    change = received - total;
  }

  const btn = document.getElementById('payConfirmBtn');
  if (btn) btn.disabled = true;

  try {
    const base = document.getElementById('riwayatPage').dataset.payUrl;
    const res = await fetch(base + '/' + payingOrder.id + '/pay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': CSRF_TOKEN
      },
      body: JSON.stringify({
        payment_method: PAY_ENUM[selectedPay],
        received
      })
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.errors ? Object.values(data.errors)[0][0] : (data.message || 'Gagal memproses pembayaran.'));
      return;
    }

    lastTrx = {
      ...histToTrx(payingOrder),
      payment: selectedPay,
      received: selectedPay === 'tunai' ? received : null,
      change
    };

    closePaymentModal();
    openReceiptModal(lastTrx);
    await loadHistory();
  } catch (e) {
    alert('Terjadi kesalahan jaringan.');
  } finally {
    if (btn) btn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', loadHistory);