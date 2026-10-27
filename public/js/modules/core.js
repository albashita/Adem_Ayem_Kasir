/**
 * Adem Ayem - Core Module
 * Pengelolaan state LocalStorage, fungsi utilitas dasar, autentikasi sesi, dan navigasi sidebar.
 */

// LocalStorage Keys
const LSU = 'kasir_users';
const LSM = 'kasir_menu';
const LST = 'kasir_transactions';
const LSL = 'kasir_stocklog';
const LSI = 'kasir_inventory';
const LSS = 'kasir_session';

// Navigasi & Role
const NAV = [
  { key: 'dashboard', label: 'Dashboard', roles: ['superadmin', 'administrator'] },
  { key: 'pengguna', label: 'Pengguna & Akses', roles: ['superadmin'] },
  { key: 'menu', label: 'Kelola Menu', roles: ['superadmin'] },
  { key: 'stok', label: 'Stok Barang', roles: ['administrator'] },
  { key: 'kasir', label: 'Kasir', roles: ['kasir'] },
  { key: 'riwayat', label: 'Transaksi Pembayaran', roles: ['kasir'] },
  { key: 'laporan', label: 'Laporan', roles: ['superadmin', 'administrator', 'kasir'] },
  { key: 'profil', label: 'Profil Saya', roles: ['superadmin', 'administrator', 'kasir'] }
];

const titles = {};
NAV.forEach(n => { titles[n.key] = n.label; });

const CAT_LABEL = {
  makanan: 'Makanan',
  minuman: 'Minuman',
  gudang: 'Gudang'
};

// Inisialisasi data bawaan di LocalStorage jika belum ada
function seedIfEmpty() {
  {
    const us = JSON.parse(localStorage.getItem(LSU) || '[]');
    let ch = false;
    us.forEach(u => {
      if (u.username === 'kasir' && u.name === 'Kasir Toko') {
        u.name = 'Adem Ayem';
        ch = true;
      }
    });
    if (ch) localStorage.setItem(LSU, JSON.stringify(us));
  }

  if (!localStorage.getItem(LSU)) {
    localStorage.setItem(LSU, JSON.stringify([
      { id: 'u1', name: 'Super Admin', username: 'superadmin', password: 'super123', role: 'superadmin' },
      { id: 'u2', name: 'Administrator', username: 'administrator', password: 'admin123', role: 'administrator' },
      { id: 'u3', name: 'Adem Ayem', username: 'kasir', password: 'kasir123', role: 'kasir' }
    ]));
  }

  if (!localStorage.getItem(LSM)) {
    localStorage.setItem(LSM, JSON.stringify([
      { id: 'm1', name: 'Nasi Goreng', category: 'Nasi', price: 18000, stock: 25, emoji: '🍚' },
      { id: 'm2', name: 'Mie Ayam', category: 'Ayam', price: 15000, stock: 20, emoji: '🍜' },
      { id: 'm3', name: 'Ayam Geprek', category: 'Ayam', price: 20000, stock: 4, emoji: '🍗' },
      { id: 'm4', name: 'Ikan Nila Bakar', category: 'Ikan', price: 28000, stock: 12, emoji: '🐟' },
      { id: 'm5', name: 'Sayur Asem', category: 'Sayur', price: 12000, stock: 18, emoji: '🥬' },
      { id: 'm6', name: 'Es Teh Manis', category: 'Minuman', price: 5000, stock: 40, emoji: '🍵' },
      { id: 'm7', name: 'Es Jeruk', category: 'Minuman', price: 6000, stock: 3, emoji: '🧃' },
      { id: 'm8', name: 'Kopi Susu', category: 'Minuman', price: 10000, stock: 15, emoji: '☕' }
    ]));
  }

  if (!localStorage.getItem(LST)) localStorage.setItem(LST, JSON.stringify([]));
  if (!localStorage.getItem(LSL)) localStorage.setItem(LSL, JSON.stringify([]));

  if (!localStorage.getItem(LSI)) {
    localStorage.setItem(LSI, JSON.stringify([
      { id: 'i1', name: 'Cabe', category: 'makanan', unit: 'kg', stock: 1 },
      { id: 'i2', name: 'Beras', category: 'makanan', unit: 'kg', stock: 25 },
      { id: 'i3', name: 'Sirup', category: 'minuman', unit: 'botol', stock: 8 },
      { id: 'i4', name: 'Es Batu', category: 'minuman', unit: 'kg', stock: 15 },
      { id: 'i5', name: 'Gas Elpiji', category: 'gudang', unit: 'tabung', stock: 5 },
      { id: 'i6', name: 'Galon Air', category: 'gudang', unit: 'galon', stock: 10 }
    ]));
  }
}

// Helpers LocalStorage
function getUsers() { return JSON.parse(localStorage.getItem(LSU) || '[]'); }
function setUsers(u) { localStorage.setItem(LSU, JSON.stringify(u)); }
function getMenu() { return JSON.parse(localStorage.getItem(LSM) || '[]'); }
function setMenu(m) { localStorage.setItem(LSM, JSON.stringify(m)); }
function getTrx() { return JSON.parse(localStorage.getItem(LST) || '[]'); }
function setTrx(t) { localStorage.setItem(LST, JSON.stringify(t)); }
function getLog() { return JSON.parse(localStorage.getItem(LSL) || '[]'); }
function setLog(l) { localStorage.setItem(LSL, JSON.stringify(l)); }
function getInv() { return JSON.parse(localStorage.getItem(LSI) || '[]'); }
function setInv(i) { localStorage.setItem(LSI, JSON.stringify(i)); }

// Formatting & Utilities
function rupiah(n) { return 'Rp ' + Number(n).toLocaleString('id-ID'); }
function rupiahNet(n) { return (n < 0 ? '- ' : '') + rupiah(Math.abs(n)); }

function escapeMenuHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}
const escapeHTML = escapeMenuHTML;

// Pengeluaran pembelian stok
function stockSpend(from, to) {
  return getLog().filter(l => {
    if (l.type !== 'masuk' || !(l.cost > 0)) return false;
    const d = l.date.slice(0, 10);
    return (!from || d >= from) && (!to || d <= to);
  }).reduce((s, l) => s + l.cost, 0);
}

// User yang sedang aktif login dari backend Laravel
function currentUser() {
  return (typeof SERVER_USER !== 'undefined') ? SERVER_USER : undefined;
}

// Autentikasi Frontend & Logout
function doLogin() {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;
  const err = document.getElementById('loginError');
  const found = getUsers().find(x => x.username === u && x.password === p);
  if (found) {
    sessionStorage.setItem(LSS, found.id);
    err.textContent = '';
    const first = NAV.find(n => n.roles.includes(found.role));
    window.location.href = ROUTE_URLS[first.key] || ROUTE_URLS.dashboard;
  } else {
    err.textContent = 'Username atau password salah.';
  }
}

function logoutUser() {
  const f = document.createElement('form');
  f.method = 'POST';
  f.action = LOGOUT_URL;
  f.innerHTML = '<input type="hidden" name="_token" value="' + CSRF_TOKEN + '">';
  document.body.appendChild(f);
  f.submit();
}

// Membangun navigasi sidebar sesuai role
function buildSidebar(role) {
  const nav = document.getElementById('sidebarNav');
  if (!nav) return;

  nav.innerHTML = `<div class="brand">Adem<span> Ayem</span></div><div class="rolechip" id="roleChip">${role}</div>`;
  NAV.filter(n => n.roles.includes(role)).forEach(n => {
    const a = document.createElement('a');
    a.className = 'navbtn' + (n.key === PAGE_KEY ? ' active' : '');
    a.href = ROUTE_URLS[n.key];
    a.textContent = (n.key === 'laporan' && role === 'administrator') ? 'Laporan Stok' : n.label;
    nav.appendChild(a);
  });

  const lo = document.createElement('button');
  lo.className = 'navbtn logout';
  lo.textContent = 'Keluar';
  lo.onclick = logoutUser;
  nav.appendChild(lo);
}

// Bootstrap halaman utama
function bootstrapPage() {
  const user = currentUser();
  if (!user) {
    window.location.href = ROUTE_URLS.login;
    return;
  }

  const navItem = NAV.find(n => n.key === PAGE_KEY);
  if (!navItem || !navItem.roles.includes(user.role)) {
    const first = NAV.find(n => n.roles.includes(user.role));
    window.location.href = first ? ROUTE_URLS[first.key] : ROUTE_URLS.login;
    return;
  }

  buildSidebar(user.role);

  const userChip = document.getElementById('userChip');
  if (userChip) userChip.textContent = user.name + ' (' + user.role + ')';

  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = titles[PAGE_KEY];

  // Routing render halaman spesifik
  if (PAGE_KEY === 'dashboard' && typeof renderDashboard === 'function') {
    renderDashboard();
  }
  if (PAGE_KEY === 'menu' && typeof renderMenuAdmin === 'function') {
    renderMenuAdmin();
  }
  if (PAGE_KEY === 'stok' && typeof renderStok === 'function') {
    renderStok();
  }
  if (PAGE_KEY === 'kasir' && typeof loadPosMenu === 'function') {
    loadPosMenu();
  }
  if (PAGE_KEY === 'riwayat' && typeof loadHistory === 'function') {
    loadHistory();
  }
  if (PAGE_KEY === 'profil' && typeof renderProfil === 'function') {
    renderProfil();
  }
  if (PAGE_KEY === 'laporan') {
    const isAdmin = user.role === 'administrator';
    const isSuper = user.role === 'superadmin';

    const finReport = document.getElementById('financeReport');
    if (finReport) finReport.style.display = isAdmin ? 'none' : 'block';

    const stockReport = document.getElementById('stockReport');
    if (stockReport) stockReport.style.display = isAdmin ? 'block' : 'none';

    if (titleEl && isAdmin) titleEl.textContent = 'Laporan Stok';

    const today = new Date().toISOString().slice(0, 10);
    if (isAdmin) {
      const stFrom = document.getElementById('stFrom');
      if (stFrom) stFrom.value = today.slice(0, 8) + '01';
      const stTo = document.getElementById('stTo');
      if (stTo) stTo.value = today;
      if (typeof renderStockReport === 'function') renderStockReport();
    } else {
      const sec = document.getElementById('reportAnalyticsSection');
      if (sec) sec.style.display = isSuper ? 'block' : 'none';
      if (isSuper && typeof renderReportAnalytics === 'function') renderReportAnalytics();
      const from = document.getElementById('repFrom');
      if (from && !from.value) {
        from.value = today;
        document.getElementById('repTo').value = today;
      }
      if (typeof renderReport === 'function') renderReport();
    }
  }
}
