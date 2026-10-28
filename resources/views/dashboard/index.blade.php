@extends('layouts.app')

@section('title', 'Dashboard - Adem Ayem')
@section('page-title', 'Dashboard')

@section('content')
@php $isAdmin = auth()->user()->role === 'admin'; @endphp

<style>
    .dash { display:flex; flex-direction:column; gap:14px; }
    .dash-head { display:flex; justify-content:flex-end; }
    .dash-pills { display:flex; gap:6px; flex-wrap:wrap; }
    .dash-pill { padding:6px 16px; border:1px solid #d5ddd8; border-radius:999px; background:#fff;
        color:#444; font-size:13px; font-weight:500; cursor:pointer; font-family:inherit; transition:.15s; }
    .dash-pill:hover { border-color:#1f5e3a; }
    .dash-pill.on { background:#1f5e3a; border-color:#1f5e3a; color:#fff; font-weight:600; }
    .dash-pill.sm { padding:4px 12px; font-size:12px; }

    .dash-kpis { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; }
    .dash-card { background:#fff; border-radius:14px; padding:14px 16px; box-shadow:0 2px 8px rgba(20,60,40,.06); min-width:0; }
    .dash-kpis .dash-card { transition:transform .15s, box-shadow .15s; }
    .dash-kpis .dash-card:hover { transform:translateY(-2px); box-shadow:0 6px 14px rgba(20,60,40,.1); }
    .dash-lbl { font-size:12px; color:#5f6b64; font-weight:500; }
    .dash-val { font-size:21px; font-weight:700; margin-top:4px; line-height:1.2; }
    .dash-note { font-size:11.5px; color:#5f6b64; margin-top:3px; }

    .dash-flex { display:flex; flex-wrap:wrap; gap:12px; }
    .dash-ttl { font-size:14.5px; font-weight:600; margin:0; }
    .dash-cardhead { display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:6px; }
    .dash-scroll { max-height:270px; overflow-y:auto; }
    .dash-row { display:flex; align-items:center; gap:10px; padding:8px 0; border-top:1px solid #edf1ee; font-size:13px; }
    .dash-row .grow { flex:1; min-width:0; }
    .dash-empty { color:#888; font-size:13px; padding:12px 0; }
    .dash-tag { font-size:11px; font-weight:600; padding:2px 9px; border-radius:999px; min-width:50px; text-align:center; }

    .dash-legend { display:flex; gap:6px; flex-wrap:wrap; }
    .dash-legend button { display:flex; align-items:center; gap:6px; border:1px solid #e1e7e3; background:#fff; border-radius:999px;
        padding:3px 10px; font-size:12px; color:#444; cursor:pointer; font-family:inherit; }
    .dash-legend button.off { opacity:.45; text-decoration:line-through; }
    .dash-legend i, .dot { display:inline-block; width:10px; height:10px; border-radius:3px; }

    .dash-bars { display:flex; align-items:flex-end; gap:8px; height:150px; padding-top:6px; }
    .dash-bar-col { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; gap:4px; height:100%; cursor:pointer; }
    .dash-bar-pair { display:flex; align-items:flex-end; gap:3px; height:112px; }
    .dash-bar-pair span { display:block; width:13px; border-radius:4px 4px 0 0; min-height:3px; height:0; transition:height .45s ease; }
    .dash-bar-col:hover .dash-bar-pair span { filter:brightness(1.1); }

    .dash-meter { width:70px; height:7px; border-radius:99px; background:#edf1ee; flex:none; }
    .dash-meter div { height:100%; border-radius:99px; }

    .dash-donut { width:104px; height:104px; border-radius:50%; flex:none; display:flex; align-items:center; justify-content:center; transition:background .3s; }
    .dash-donut div { width:62px; height:62px; border-radius:50%; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }
    .dash-donut b { font-size:15px; line-height:1.1; }
    .dash-donut small { font-size:10px; color:#5f6b64; }
    .dash-legrow { display:flex; justify-content:space-between; align-items:center; padding:4px 6px; border-radius:8px; cursor:default; }
    .dash-legrow:hover { background:#f1f5f2; }

    #tip { position:fixed; display:none; z-index:50; background:#1d2a23; color:#fff; font-size:12px;
        padding:6px 10px; border-radius:8px; pointer-events:none; max-width:240px; }

    @media (max-width:900px) { .dash-flex > .dash-card { flex:1 1 100% !important; } }
    @media (max-width:560px) {
        .dash-kpis { grid-template-columns:repeat(2,1fr); }
        .dash-val { font-size:18px; }
        .dash-meter { display:none; }
        .dash-head { justify-content:stretch; }
        .dash-head .dash-pills { width:100%; }
        .dash-head .dash-pill { flex:1; }
    }
</style>

<div class="dash">

    <div class="dash-head">
        <div class="dash-pills" id="periodPills">
            <button type="button" class="dash-pill on" data-k="today">Hari ini</button>
            <button type="button" class="dash-pill" data-k="w">7 hari</button>
            <button type="button" class="dash-pill" data-k="m">Bulan ini</button>
        </div>
    </div>

    <div class="dash-kpis" id="kpis"></div>

    @if ($isAdmin)
        {{-- ================= ADMIN ================= --}}
        <div class="dash-flex">
            <div class="dash-card" style="flex:1.4 1 400px">
                <div class="dash-cardhead">
                    <h3 class="dash-ttl">Stok menipis</h3>
                    <div class="dash-pills" id="catPills">
                        <button type="button" class="dash-pill sm on" data-k="all">Semua</button>
                        <button type="button" class="dash-pill sm" data-k="makanan">Makanan</button>
                        <button type="button" class="dash-pill sm" data-k="minuman">Minuman</button>
                        <button type="button" class="dash-pill sm" data-k="gudang">Gudang</button>
                    </div>
                </div>
                <div class="dash-scroll" id="lowList"></div>
            </div>

            <div class="dash-card" style="flex:1 1 300px">
                <div class="dash-cardhead">
                    <h3 class="dash-ttl">Pembelian 7 hari terakhir</h3>
                </div>
                <div class="dash-bars" id="chart"></div>
            </div>
        </div>

        <div class="dash-card">
            <div class="dash-cardhead">
                <h3 class="dash-ttl">Pergerakan stok terbaru</h3>
                <div class="dash-pills" id="mvPills">
                    <button type="button" class="dash-pill sm on" data-k="all">Semua</button>
                    <button type="button" class="dash-pill sm" data-k="in">Masuk</button>
                    <button type="button" class="dash-pill sm" data-k="out">Keluar</button>
                </div>
            </div>
            <div class="dash-scroll" id="mvList"></div>
        </div>
    @else
        {{-- ================= OWNER ================= --}}
        <div class="dash-flex">
            <div class="dash-card" style="flex:1 1 280px">
                <div class="dash-cardhead"><h3 class="dash-ttl">Metode pembayaran</h3></div>
                <div style="display:flex;align-items:center;gap:16px">
                    <div class="dash-donut" id="donut" role="img" aria-label="Donat metode pembayaran">
                        <div><b id="donutMain">0</b><small id="donutSub">transaksi</small></div>
                    </div>
                    <div id="donutLegend" style="flex:1;font-size:13px"></div>
                </div>
            </div>

            <div class="dash-card" style="flex:1.5 1 360px">
                <div class="dash-cardhead">
                    <h3 class="dash-ttl">Pemasukan vs pengeluaran (7 hari)</h3>
                    <div class="dash-legend" id="chartLegend">
                        <button type="button" data-s="a"><i style="background:#2f7d4f"></i>Pemasukan</button>
                        <button type="button" data-s="b"><i style="background:#e2b94a"></i>Pengeluaran</button>
                    </div>
                </div>
                <div class="dash-bars" id="chart"></div>
            </div>
        </div>

        <div class="dash-card">
            <div class="dash-cardhead">
                <div class="dash-pills" id="tabPills">
                    <button type="button" class="dash-pill sm on" data-k="best">Menu terlaris</button>
                    <button type="button" class="dash-pill sm" data-k="low">Stok menipis</button>
                    <button type="button" class="dash-pill sm" data-k="act">Aktivitas terbaru</button>
                </div>
            </div>
            <div class="dash-scroll" id="tabBody"></div>
        </div>
    @endif
</div>

<div id="tip" role="tooltip"></div>

@push('scripts')
<script>
/* ============ DATA CONTOH (dummy, belum terhubung database) ============ */
const IS_ADMIN = @json($isAdmin);

const OWNER = {
    today: { income: 4250000,  expense: 1380000,  trx: 86,   pending: 5,  pendingTotal: 310000,  methods: [52, 33, 15] },
    w:     { income: 27400000, expense: 9650000,  trx: 540,  pending: 12, pendingTotal: 720000,  methods: [49, 35, 16] },
    m:     { income: 98200000, expense: 36100000, trx: 1980, pending: 20, pendingTotal: 1250000, methods: [47, 36, 17] }
};
const OWNER_CHART = {
    a: [3100000, 3900000, 2800000, 4100000, 5200000, 4600000, 4250000],
    b: [1100000, 600000, 1400000, 900000, 1500000, 1200000, 1380000]
};
const BEST = [['Gurame bakar', 34], ['Nasi goreng', 29], ['Es teh', 27], ['Jamur krispi', 18], ['Ayam goreng', 15]];
const ACTIVITY = [
    ['Kasir 1', 'Menyelesaikan pesanan INV-0086', '2 mnt lalu'],
    ['Kasir 1', 'Membuat pesanan INV-0087', '5 mnt lalu'],
    ['Admin',   'Mencatat pembelian stok', '35 mnt lalu'],
    ['Owner',   'Mengubah harga menu', '1 jam lalu']
];
const ADMIN = {
    today: { buyTotal: 680000,   buyCount: 2,  masuk: 14,  keluar: 9 },
    w:     { buyTotal: 4920000,  buyCount: 11, masuk: 63,  keluar: 48 },
    m:     { buyTotal: 17350000, buyCount: 38, masuk: 241, keluar: 197 }
};
const ADMIN_CHART = [420000, 0, 780000, 310000, 950000, 520000, 680000];
const STOCK = [
    { n: 'Jamur tiram',   cat: 'makanan', cur: 0, min: 2,  u: 'kg' },
    { n: 'Beras',         cat: 'gudang',  cur: 4, min: 10, u: 'kg' },
    { n: 'Ikan gurame',   cat: 'makanan', cur: 6, min: 10, u: 'ekor' },
    { n: 'Teh celup',     cat: 'minuman', cur: 1, min: 3,  u: 'dus' },
    { n: 'Minyak goreng', cat: 'gudang',  cur: 3, min: 5,  u: 'liter' },
    { n: 'Sirup',         cat: 'minuman', cur: 2, min: 4,  u: 'botol' }
];
const MOVES = [
    { t: 'in',  n: 'Beras',         q: '25 kg',   s: 'Pembelian', by: 'Admin', w: '35 mnt lalu' },
    { t: 'in',  n: 'Ikan gurame',   q: '12 ekor', s: 'Pembelian', by: 'Admin', w: '2 jam lalu' },
    { t: 'out', n: 'Teh celup',     q: '3 dus',   s: 'Produksi',  by: 'Admin', w: '3 jam lalu' },
    { t: 'out', n: 'Minyak goreng', q: '4 liter', s: 'Produksi',  by: 'Admin', w: '5 jam lalu' },
    { t: 'in',  n: 'Gula pasir',    q: '10 kg',   s: 'Pembelian', by: 'Admin', w: 'Kemarin' },
    { t: 'out', n: 'Ayam potong',   q: '8 kg',    s: 'Produksi',  by: 'Admin', w: 'Kemarin' }
];
/* ======================================================================= */

const $ = id => document.getElementById(id);
const rp = n => 'Rp ' + new Intl.NumberFormat('id-ID').format(n);
const DAYS = ['Kam', 'Jum', 'Sab', 'Min', 'Sen', 'Sel', 'Rab'];
const PERIOD_TEXT = { today: 'hari ini', w: '7 hari terakhir', m: 'bulan ini' };
const COLORS = ['#2f7d4f', '#e2b94a', '#7aa8c9'];
const METHODS = ['Tunai', 'QRIS', 'Transfer'];

let state = { period: 'today', cat: 'all', mv: 'all', tab: 'best', hide: { a: false, b: false } };

/* ---------- tooltip ---------- */
const tip = $('tip');
document.addEventListener('mousemove', e => {
    const el = e.target.closest('[data-tip]');
    if (!el) { tip.style.display = 'none'; return; }
    tip.textContent = el.dataset.tip;
    tip.style.display = 'block';
    tip.style.left = Math.min(e.clientX + 12, window.innerWidth - 250) + 'px';
    tip.style.top = (e.clientY + 14) + 'px';
});
document.addEventListener('click', e => {
    const el = e.target.closest('[data-tip]');
    if (el && window.matchMedia('(hover: none)').matches) {
        tip.textContent = el.dataset.tip; tip.style.display = 'block';
        tip.style.left = '16px'; tip.style.top = (e.clientY - 50) + 'px';
        setTimeout(() => tip.style.display = 'none', 2200);
    }
});

/* ---------- kartu ringkasan ---------- */
function kpi(label, value, note, color) {
    return `<div class="dash-card"><div class="dash-lbl">${label}</div>
        <div class="dash-val" style="color:${color || 'inherit'}">${value}</div>
        <div class="dash-note">${note}</div></div>`;
}
function renderKpis() {
    const pt = PERIOD_TEXT[state.period];
    if (IS_ADMIN) {
        const d = ADMIN[state.period];
        $('kpis').innerHTML =
            kpi('Stok menipis', STOCK.length, `item, ${STOCK.filter(s => s.cur === 0).length} habis`, '#a33a2a') +
            kpi('Barang masuk', d.masuk, 'penambahan stok · ' + pt, '#2f7d4f') +
            kpi('Total pembelian', rp(d.buyTotal), d.buyCount + ' nota · ' + pt, '#8a6a12') +
            kpi('Barang keluar', d.keluar, 'pemakaian bahan · ' + pt, '#3b4350');
    } else {
        const d = OWNER[state.period];
        $('kpis').innerHTML =
            kpi('Pemasukan', rp(d.income), 'pesanan yang sudah dibayar', '#2f7d4f') +
            kpi('Pengeluaran', rp(d.expense), 'pembelian stok', '#8a6a12') +
            kpi('Laba kotor', rp(d.income - d.expense), 'pemasukan - pengeluaran') +
            kpi('Transaksi', d.trx, 'rata-rata ' + rp(Math.round(d.income / d.trx))) +
            kpi('Menunggu bayar', d.pending, 'senilai ' + rp(d.pendingTotal));
    }
}

/* ---------- grafik batang ---------- */
function renderChart() {
    let html = '';
    if (IS_ADMIN) {
        const max = Math.max(...ADMIN_CHART);
        html = ADMIN_CHART.map((v, i) => {
            const h = Math.round(v / max * 112);
            return `<div class="dash-bar-col" data-tip="${DAYS[i]} · Pembelian ${rp(v)}">
                <div class="dash-bar-pair"><span data-h="${h}" style="background:${i === 6 ? '#2f7d4f' : '#a9cdb5'}"></span></div>
                <span class="dash-lbl">${DAYS[i]}</span></div>`;
        }).join('');
    } else {
        const vis = ['a', 'b'].filter(k => !state.hide[k]);
        const max = Math.max(1, ...vis.flatMap(k => OWNER_CHART[k]));
        html = DAYS.map((d, i) => {
            const a = OWNER_CHART.a[i], b = OWNER_CHART.b[i];
            const tip = `${d} · Pemasukan ${rp(a)} · Pengeluaran ${rp(b)}`;
            return `<div class="dash-bar-col" data-tip="${tip}"><div class="dash-bar-pair">
                ${state.hide.a ? '' : `<span data-h="${Math.round(a / max * 112)}" style="background:#2f7d4f"></span>`}
                ${state.hide.b ? '' : `<span data-h="${Math.round(b / max * 112)}" style="background:#e2b94a"></span>`}
                </div><span class="dash-lbl">${d}</span></div>`;
        }).join('');
    }
    $('chart').innerHTML = html;
    requestAnimationFrame(() => requestAnimationFrame(() =>
        document.querySelectorAll('#chart [data-h]').forEach(s => s.style.height = s.dataset.h + 'px')));
}

/* ---------- stok ---------- */
function lowRow(s, full) {
    const empty = s.cur === 0;
    const pct = Math.max(4, Math.min(100, Math.round(s.cur / s.min * 100)));
    return `<div class="dash-row"><div class="grow"><b style="font-weight:600">${s.n}</b><br>
        <span class="dash-lbl">min. ${s.min} ${s.u}</span></div>
        ${full ? `<span class="dash-tag" style="background:${empty ? '#f8d9d3' : '#fdeccc'};color:${empty ? '#8a2a1c' : '#7a5200'}">${empty ? 'Habis' : 'Menipis'}</span>` : ''}
        <b style="min-width:62px;text-align:right;color:#a33a2a">${s.cur} ${s.u}</b>
        ${full ? `<div class="dash-meter"><div style="width:${pct}%;background:${empty ? '#c9503c' : '#e2a42f'}"></div></div>` : ''}</div>`;
}
function renderStock() {
    const rows = STOCK.filter(s => state.cat === 'all' || s.cat === state.cat);
    $('lowList').innerHTML = rows.length ? rows.map(s => lowRow(s, true)).join('')
        : '<div class="dash-empty">Semua stok pada kategori ini aman.</div>';
}
function renderMoves() {
    const rows = MOVES.filter(m => state.mv === 'all' || m.t === state.mv);
    $('mvList').innerHTML = rows.map(m => `<div class="dash-row">
        <span class="dash-tag" style="background:${m.t === 'in' ? '#dcefe3' : '#e8eaed'};color:${m.t === 'in' ? '#1f5e3a' : '#3b4350'}">${m.t === 'in' ? 'Masuk' : 'Keluar'}</span>
        <div class="grow"><b style="font-weight:600">${m.n}</b> · ${m.q}<br><span class="dash-lbl">${m.s} · ${m.by}</span></div>
        <span class="dash-lbl">${m.w}</span></div>`).join('');
}

/* ---------- owner: donat, tab ---------- */
function renderDonut() {
    const d = OWNER[state.period], m = d.methods;
    let acc = 0;
    const stops = m.map((p, i) => { const f = acc; acc += p; return `${COLORS[i]} ${f}% ${acc}%`; });
    $('donut').style.background = `conic-gradient(${stops.join(',')})`;
    const resetCenter = () => { $('donutMain').textContent = d.trx; $('donutSub').textContent = 'transaksi'; };
    resetCenter();
    $('donutLegend').innerHTML = m.map((p, i) => `<div class="dash-legrow" data-i="${i}">
        <span><i class="dot" style="background:${COLORS[i]};margin-right:8px"></i>${METHODS[i]}</span><b>${p}%</b></div>`).join('');
    $('donutLegend').querySelectorAll('.dash-legrow').forEach(r => {
        r.addEventListener('mouseenter', () => {
            const i = +r.dataset.i;
            $('donutMain').textContent = m[i] + '%';
            $('donutSub').textContent = METHODS[i];
        });
        r.addEventListener('mouseleave', resetCenter);
    });
}
function renderTab() {
    let html = '';
    if (state.tab === 'best') {
        html = BEST.map((b, i) => `<div class="dash-row"><b style="width:20px;color:#2f7d4f">${i + 1}</b>
            <span class="grow">${b[0]}</span><b>${b[1]} terjual</b></div>`).join('');
    } else if (state.tab === 'low') {
        html = STOCK.map(s => lowRow(s, false)).join('');
    } else {
        html = ACTIVITY.map(a => `<div class="dash-row"><span class="grow">${a[0]}<br>
            <span class="dash-lbl">${a[1]}</span></span><span class="dash-lbl">${a[2]}</span></div>`).join('');
    }
    $('tabBody').innerHTML = html;
}

/* ---------- kontrol ---------- */
function bindPills(id, key, after) {
    const box = $(id);
    if (!box) return;
    box.addEventListener('click', e => {
        const btn = e.target.closest('button[data-k]');
        if (!btn) return;
        state[key] = btn.dataset.k;
        box.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === btn));
        after();
    });
}
function renderAll() {
    renderKpis();
    if (!IS_ADMIN) renderDonut();
}

bindPills('periodPills', 'period', renderAll);
bindPills('catPills', 'cat', renderStock);
bindPills('mvPills', 'mv', renderMoves);
bindPills('tabPills', 'tab', renderTab);

if (!IS_ADMIN) {
    $('chartLegend').addEventListener('click', e => {
        const btn = e.target.closest('button[data-s]');
        if (!btn) return;
        const k = btn.dataset.s;
        const other = k === 'a' ? 'b' : 'a';
        if (!state.hide[k] && state.hide[other]) return;   // minimal satu seri tetap tampil
        state.hide[k] = !state.hide[k];
        btn.classList.toggle('off', state.hide[k]);
        renderChart();
    });
}

renderAll();
renderChart();
if (IS_ADMIN) { renderStock(); renderMoves(); } else { renderTab(); }
</script>
@endpush
@endsection