@extends('layouts.app')

@section('title', 'Dashboard - Adem Ayem')
@section('page-title', 'Dashboard')

@section('content')

<style>
    .dash { display:flex; flex-direction:column; gap:16px; }
    .dash-head { display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; }
    .dash-pills, .dash-actions { display:flex; gap:6px; flex-wrap:wrap; }
    .dash-pill { padding:7px 16px; border:1px solid #d5ddd8; border-radius:999px; background:#fff; color:#33443a;
        font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; text-decoration:none; transition:.15s; }
    .dash-pill:hover { border-color:#1f5e3a; }
    .dash-pill.on { background:#1f5e3a; border-color:#1f5e3a; color:#fff; }
    .dash-kpis { display:grid; grid-template-columns:repeat(auto-fit,minmax(170px,1fr)); gap:14px; }
    .dash-card { background:#fff; border-radius:16px; padding:18px 20px; box-shadow:0 1px 3px rgba(20,60,40,.07); min-width:0; }
    .dash-lbl { font-size:12px; color:#5b6b61; font-weight:500; }
    .dash-val { font-size:24px; font-weight:800; margin:6px 0 4px; line-height:1.15; }
    .dash-note { font-size:12px; color:#5b6b61; }
    .up { font-size:12px; font-weight:600; color:#1f7a4a; }
    .dn { font-size:12px; font-weight:600; color:#a33b2c; }
    .dash-two { display:grid; grid-template-columns:2fr 1fr; gap:16px; }
    .dash-three { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
    .dash-half { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .dash-ttl { font-size:15px; font-weight:700; margin:0 0 14px; }
    .dash-legend { display:flex; gap:14px; font-size:12px; }
    .dot { display:inline-block; width:10px; height:10px; border-radius:3px; margin-right:6px; }
    .dash-row { display:flex; align-items:center; gap:10px; padding:9px 0; border-top:1px solid #edf1ee; font-size:13px; }
    .dash-row:first-child { border-top:0; }
    .grow { flex:1; min-width:0; }
    .track { height:8px; background:#e8efe9; border-radius:6px; overflow:hidden; margin-top:5px; }
    .track div { height:100%; border-radius:6px; }
    .dash-empty { color:#7a877f; font-size:13px; padding:10px 0; }
    .dash-tag { font-size:11px; font-weight:700; padding:2px 9px; border-radius:999px; }
    .dash-donut { width:150px; height:150px; border-radius:50%; flex:none; display:flex; align-items:center; justify-content:center; background:#e8efe9; }
    .dash-donut div { width:92px; height:92px; border-radius:50%; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; }
    .dash-donut b { font-size:22px; line-height:1.1; }
    .dash-donut small { font-size:11px; color:#5b6b61; }
    .dash-pay { display:flex; flex-direction:column; align-items:center; gap:18px; }
    .dash-pay .legend { width:100%; display:flex; flex-direction:column; gap:12px; font-size:13px; }
    .dash-total { border-top:1px solid #e3eae5; padding-top:10px; display:flex; justify-content:space-between; gap:8px; }
    @media (max-width:980px) { .dash-two, .dash-three, .dash-half { grid-template-columns:1fr; } }
    @media (max-width:560px) { .dash-kpis { grid-template-columns:repeat(2,1fr); } .dash-val { font-size:19px; } }
</style>

<div class="dash">
    <div class="dash-head">
        <div class="dash-pills" id="periodPills">
            <button type="button" class="dash-pill on" data-k="today">Hari ini</button>
            <button type="button" class="dash-pill" data-k="w">7 hari</button>
            <button type="button" class="dash-pill" data-k="m">Bulan ini</button>
        </div>
        @if ($isAdmin)
        <div class="dash-actions">
            <a class="dash-pill" href="{{ url('/stok') }}">+ Tambah Bahan</a>
            <a class="dash-pill" href="{{ url('/pengeluaran') }}">+ Catat Pengeluaran</a>
        </div>
        @endif
    </div>

    <div class="dash-kpis" id="kpis"></div>

    <div class="dash-two">
        <div class="dash-card">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px">
                <h3 class="dash-ttl" style="margin:0">{{ $isAdmin ? 'Pengeluaran 7 hari terakhir' : 'Pemasukan vs pengeluaran (7 hari)' }}</h3>
                <div class="dash-legend" id="chartLegend"></div>
            </div>
            <div id="chart"></div>
        </div>

        <div class="dash-card">
            <h3 class="dash-ttl">{{ $isAdmin ? 'Pengeluaran per kategori' : 'Metode pembayaran' }}</h3>
            <div class="dash-pay">
                <div class="dash-donut" id="donut" role="img" aria-label="Diagram donat">
                    <div><b id="donutMain">0</b><small id="donutSub"></small></div>
                </div>
                <div class="legend" id="donutLegend"></div>
            </div>
        </div>
    </div>

    @if ($isAdmin)
    <div class="dash-half">
        <div class="dash-card"><h3 class="dash-ttl">Stok menipis</h3><div id="lowList"></div></div>
        <div class="dash-card"><h3 class="dash-ttl">Pergerakan stok terbaru</h3><div id="feedList"></div></div>
    </div>
    @else
    <div class="dash-three">
        <div class="dash-card"><h3 class="dash-ttl">Menu terlaris</h3><div id="bestList"></div></div>
        <div class="dash-card"><h3 class="dash-ttl">Stok menipis</h3><div id="lowList"></div></div>
        <div class="dash-card"><h3 class="dash-ttl">Aktivitas terbaru</h3><div id="feedList"></div></div>
    </div>
    @endif
</div>

@push('scripts')
<script>
const IS_ADMIN = @json($isAdmin);
const STATS = @json($stats);
const CHART = @json($chart);
const LOW = @json($lowStock);
const FEED = @json($feed);
const STOCK_COUNT = @json($stockCount);

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const rp = n => 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(n || 0));
const num = n => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(n || 0);
const COLORS = ['#2f7d4f', '#d9a21b', '#6b9fd4', '#b56a8f', '#8a8f98'];
const PT = { today: 'hari ini', w: '7 hari terakhir', m: 'bulan ini' };
let period = 'today';

/* ---------- kartu ringkasan ---------- */
function delta(cur, prev, badUp) {
    if (!prev) return '<span class="dash-note">belum ada pembanding</span>';
    const p = Math.round((cur - prev) / prev * 100);
    if (p === 0) return '<span class="dash-note">sama seperti periode lalu</span>';
    const good = badUp ? p < 0 : p > 0;
    return `<span class="${good ? 'up' : 'dn'}">${p > 0 ? '▲' : '▼'} ${Math.abs(p)}% dari periode lalu</span>`;
}
function kpi(label, value, note, color) {
    return `<div class="dash-card"><div class="dash-lbl">${label}</div>
        <div class="dash-val" style="color:${color || 'inherit'}">${value}</div><div>${note}</div></div>`;
}
function renderKpis() {
    const d = STATS[period];
    if (IS_ADMIN) {
        const habis = LOW.filter(s => s.cur <= 0).length;
        $('kpis').innerHTML =
            kpi('Jenis bahan aktif', STOCK_COUNT, '<span class="dash-note">terdaftar di stok</span>') +
            kpi('Stok menipis', LOW.length, `<span class="dash-note">${habis} habis</span>`, LOW.length ? '#a33b2c' : '#1f5e3a') +
            kpi('Barang masuk', d.masuk, `<span class="dash-note">pencatatan · ${PT[period]}</span>`, '#1f5e3a') +
            kpi('Barang keluar', d.keluar, `<span class="dash-note">pencatatan · ${PT[period]}</span>`) +
            kpi('Pembelian bahan baku', rp(d.buyTotal), `<span class="dash-note">${d.buyCount} nota · ${PT[period]}</span>`, '#8a5a00');
    } else {
        $('kpis').innerHTML =
            kpi('Total Pendapatan', rp(d.income), delta(d.income, d.prevIncome, false), '#1f5e3a') +
            kpi('Total Pengeluaran', rp(d.expense), delta(d.expense, d.prevExpense, true), '#8a5a00') +
            kpi('Pendapatan Bersih', rp(d.net), '<span class="dash-note">pendapatan - pengeluaran</span>', d.net >= 0 ? 'inherit' : '#a33b2c') +
            kpi('Transaksi', d.trx, `<span class="dash-note">rata-rata ${rp(d.trx ? d.income / d.trx : 0)}</span>`) +
            kpi('Menunggu bayar', d.pending, `<span class="dash-note">senilai ${rp(d.pendingTotal)}</span>`);
    }
}

/* ---------- grafik garis (SVG) ---------- */
function compact(v) {
    if (v >= 1e6) return (v / 1e6).toFixed(1).replace('.0', '') + ' jt';
    if (v >= 1e3) return Math.round(v / 1e3) + ' rb';
    return Math.round(v);
}
function drawBars(labels, series) {
    const W = 660, L = 56, R = 640, T = 20, B = 190;
    const max = Math.max(1, ...series.flatMap(s => s.data));
    const p = Math.pow(10, Math.floor(Math.log10(max)));
    const top = Math.ceil(max / (p / 2)) * (p / 2);
    const y = v => B - (v / top) * (B - T);
    const slot = (R - L) / labels.length;
    const bw = Math.min(28, slot / (series.length + 1.2));
    let g = '';
    for (let k = 0; k <= 4; k++) {
        const v = top * k / 4, yy = y(v);
        g += `<line x1="${L}" y1="${yy}" x2="${R}" y2="${yy}" stroke="#e3eae5"/>
              <text x="${L - 8}" y="${yy + 4}" text-anchor="end" font-size="11" fill="#5b6b61">${compact(v)}</text>`;
    }
    labels.forEach((l, i) => {
        const cx = L + slot * i + slot / 2;
        g += `<text x="${cx}" y="214" text-anchor="middle" font-size="11" fill="#5b6b61">${l}</text>`;
        const groupW = series.length * bw + (series.length - 1) * 4;
        series.forEach((s, si) => {
            const v = s.data[i];
            const h = v > 0 ? Math.max(4, B - y(v)) : 0;
            const bx = cx - groupW / 2 + si * (bw + 4);
            g += `<rect x="${bx}" y="${B - h}" width="${bw}" height="${h}" rx="5" fill="${s.color}"><title>${l} · ${s.name}: ${rp(v)}</title></rect>`;
        });
    });
    $('chart').innerHTML = `<svg viewBox="0 0 ${W} 230" style="width:100%;height:auto" role="img" aria-label="Grafik batang 7 hari terakhir">${g}</svg>`;
}
function renderChart() {
    if (IS_ADMIN) {
        $('chartLegend').innerHTML = '';
        drawBars(CHART.days, [{ name: 'Pengeluaran', color: '#d9a21b', data: CHART.expense }]);
    } else {
        $('chartLegend').innerHTML =
            '<span><i class="dot" style="background:#2f7d4f"></i>Pemasukan</span><span><i class="dot" style="background:#d9a21b"></i>Pengeluaran</span>';
        drawBars(CHART.days, [
            { name: 'Pemasukan', color: '#2f7d4f', data: CHART.income },
            { name: 'Pengeluaran', color: '#d9a21b', data: CHART.expense },
        ]);
    }
}

/* ---------- donat + rincian ---------- */
function renderDonut() {
    const d = STATS[period];
    // items: {label, value, sub}
    const items = IS_ADMIN
        ? d.byCategory.map(c => ({ label: c.label, value: c.total, sub: rp(c.total) }))
        : d.methods.map(m => ({ label: m.label, value: m.total, sub: `${m.count} transaksi · ${rp(m.total)}` }));
    const sum = items.reduce((a, i) => a + i.value, 0);
    let acc = 0;
    const stops = items.filter(i => i.value > 0).map(i => {
        const from = acc / sum * 100; acc += i.value;
        return `${COLORS[items.indexOf(i) % COLORS.length]} ${from}% ${acc / sum * 100}%`;
    });
    $('donut').style.background = sum ? `conic-gradient(${stops.join(',')})` : '#e8efe9';
    $('donutMain').textContent = IS_ADMIN ? compact(sum) : d.trx;
    $('donutSub').textContent = IS_ADMIN ? 'total' : 'transaksi';

    $('donutLegend').innerHTML = items.length ? items.map((i, k) => `<div>
        <i class="dot" style="background:${COLORS[k % COLORS.length]}"></i><b>${esc(i.label)}</b>
        <span class="dash-note" style="margin-left:6px">${sum ? Math.round(i.value / sum * 100) : 0}%</span>
        <div class="dash-lbl" style="margin-left:16px">${i.sub}</div></div>`).join('') +
        `<div class="dash-total"><b>Total</b><b>${IS_ADMIN ? rp(sum) : d.trx + ' transaksi · ' + rp(sum)}</b></div>`
        : '<div class="dash-empty">Belum ada data.</div>';
}

/* ---------- daftar ---------- */
function renderLow() {
    $('lowList').innerHTML = LOW.length ? LOW.map(s => {
        const empty = s.cur <= 0;
        const pct = Math.max(4, Math.min(100, Math.round(s.cur / (s.min || 1) * 100)));
        return `<div class="dash-row"><div class="grow"><b>${esc(s.name)}</b>
            <div class="dash-lbl">min. ${num(s.min)} ${esc(s.unit)}</div>
            <div class="track"><div style="width:${pct}%;background:${empty ? '#c4452f' : '#d9a21b'}"></div></div></div>
            <b style="color:#a33b2c;white-space:nowrap">${num(s.cur)} ${esc(s.unit)}</b></div>`;
    }).join('') : '<div class="dash-empty">Semua stok aman.</div>';
}
function renderBest() {
    if (IS_ADMIN) return;
    const list = STATS[period].best;
    const max = Math.max(1, ...list.map(b => b.qty));
    $('bestList').innerHTML = list.length ? list.map((b, i) => `<div class="dash-row">
        <b style="width:18px;color:#1f5e3a">${i + 1}</b>
        <div class="grow">${esc(b.name)}<div class="track"><div style="width:${b.qty / max * 100}%;background:#1f5e3a"></div></div></div>
        <b>${b.qty}</b></div>`).join('') : `<div class="dash-empty">Belum ada penjualan ${PT[period]}.</div>`;
}
function renderFeed() {
    if (!FEED.length) { $('feedList').innerHTML = '<div class="dash-empty">Belum ada aktivitas.</div>'; return; }
    $('feedList').innerHTML = IS_ADMIN ? FEED.map(m => `<div class="dash-row">
        <span class="dash-tag" style="background:${m.type === 'in' ? '#dcefe3' : '#e8eaed'};color:${m.type === 'in' ? '#1f5e3a' : '#3b4350'}">${m.type === 'in' ? 'Masuk' : 'Keluar'}</span>
        <div class="grow"><b>${esc(m.name)}</b> · ${num(m.qty)} ${esc(m.unit)}<div class="dash-lbl">${esc(m.desc)}</div></div>
        <span class="dash-lbl">${esc(m.time)}</span></div>`).join('')
        : FEED.map(a => `<div class="dash-row"><div class="grow"><b>${esc(a.title)}</b>
        <div class="dash-lbl">${esc(a.sub)}</div></div><span class="dash-lbl">${esc(a.time)}</span></div>`).join('');
}

/* ---------- kontrol ---------- */
function renderAll() { renderKpis(); renderDonut(); renderBest(); }
$('periodPills').addEventListener('click', e => {
    const btn = e.target.closest('button[data-k]');
    if (!btn) return;
    period = btn.dataset.k;
    $('periodPills').querySelectorAll('button').forEach(b => b.classList.toggle('on', b === btn));
    renderAll();
});

renderAll();
renderChart();
renderLow();
renderFeed();
</script>
@endpush
@endsection