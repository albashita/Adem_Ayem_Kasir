<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

    <title>Adem Ayem</title>

    <link rel="stylesheet" href="{{ asset('css/style.css') }}">
</head>

<body>

    <!-- ==================== LOGIN ==================== -->
    <div id="loginScreen">
        <div class="login-card">

            <h1>Adem<span> Ayem</span></h1>

            <p class="sub">
                Masuk untuk mengelola sistem
            </p>

            <div class="field">
                <label>Username</label>

                <input
                    id="loginUser"
                    placeholder="superadmin"
                >
            </div>

            <div class="field">
                <label>Password</label>

                <input
                    id="loginPass"
                    type="password"
                    placeholder="••••••••"
                >
            </div>

            <button
                class="btn btn-primary"
                onclick="doLogin()"
            >
                Masuk
            </button>

            <div
                class="error-msg"
                id="loginError"
            ></div>

            <div class="hint">
                Demo akun:<br>
                superadmin / super123<br>
                administrator / admin123<br>
                kasir / kasir123
            </div>

        </div>
    </div>


    <!-- ==================== APPLICATION ==================== -->
    <div id="appScreen">

        <div class="shell">

            <!-- SIDEBAR -->
            <div
                class="sidebar"
                id="sidebarNav"
            >

                <div class="brand">
                    Adem<span> Ayem</span>
                </div>

                <div
                    class="rolechip"
                    id="roleChip"
                ></div>

            </div>


            <!-- MAIN -->
            <div class="main">

                <!-- TOPBAR -->
                <div class="topbar">

                    <h2 id="pageTitle">
                        Dashboard
                    </h2>

                    <div class="userchip">
                        Masuk sebagai
                        <b id="userChip"></b>
                    </div>

                </div>


                <!-- ==================== DASHBOARD ==================== -->
                <div id="page-dashboard">

                    <div
                        class="grid"
                        id="dashStats"
                    ></div>

                    <div class="panel">

                        <h3>
                            Stok Menipis (≤5)
                        </h3>

                        <table>

                            <thead>

                                <tr>
                                    <th>Menu</th>
                                    <th>Kategori</th>
                                    <th>Sisa Stok</th>
                                </tr>

                            </thead>

                            <tbody id="lowStockBody"></tbody>

                        </table>

                    </div>

                </div>


                <!-- ==================== PENGGUNA ==================== -->
                <div
                    id="page-pengguna"
                    style="display:none;"
                >

                    <div class="panel">

                        <h3>
                            Tambah / Ubah Pengguna
                        </h3>

                        <div class="form-row">

                            <div class="field">
                                <label>Nama</label>

                                <input
                                    id="uName"
                                    placeholder="Nama lengkap"
                                >
                            </div>

                            <div class="field">
                                <label>Username</label>

                                <input
                                    id="uUser"
                                    placeholder="username"
                                >
                            </div>

                            <div class="field">
                                <label>Password</label>

                                <input
                                    id="uPass"
                                    type="text"
                                    placeholder="password"
                                >
                            </div>

                            <div class="field">

                                <label>Role</label>

                                <select id="uRole">

                                    <option value="superadmin">
                                        Superadmin
                                    </option>

                                    <option value="administrator">
                                        Administrator
                                    </option>

                                    <option value="kasir">
                                        Kasir
                                    </option>

                                </select>

                            </div>

                            <button
                                class="btn btn-primary"
                                id="uSaveBtn"
                                onclick="saveUser()"
                            >
                                Simpan
                            </button>

                        </div>

                    </div>


                    <div class="panel">

                        <h3>
                            Daftar Pengguna
                        </h3>

                        <table>

                            <thead>

                                <tr>
                                    <th>Nama</th>
                                    <th>Username</th>
                                    <th>Role</th>
                                    <th>Aksi</th>
                                </tr>

                            </thead>

                            <tbody id="userBody"></tbody>

                        </table>

                    </div>

                </div>


                <!-- ==================== MENU ==================== -->
                <div
                    id="page-menu"
                    style="display:none;"
                >

                    <div class="panel">

                        <h3>
                            Tambah / Ubah Menu
                        </h3>

                        <div class="form-row">

                            <div class="field">

                                <label>
                                    Nama Menu
                                </label>

                                <input
                                    id="mName"
                                    placeholder="Nasi Goreng"
                                >

                            </div>


                            <div class="field">

                                <label>
                                    Kategori
                                </label>

                                <input
                                    id="mCat"
                                    placeholder="Nasi / Ikan / Ayam / Sayur / Minuman"
                                >

                            </div>


                            <div class="field">

                                <label>
                                    Harga (Rp)
                                </label>

                                <input
                                    id="mPrice"
                                    type="number"
                                    placeholder="15000"
                                >

                            </div>


                            <button
                                class="btn btn-primary"
                                id="mSaveBtn"
                                onclick="saveMenu()"
                            >
                                Simpan
                            </button>

                        </div>


                        <div class="field">

                            <label>
                                Gambar (pilih ikon)
                            </label>

                            <div
                                class="emoji-pick"
                                id="emojiPick"
                            ></div>

                        </div>

                    </div>


                    <div class="panel">

                        <h3>
                            Daftar Menu
                        </h3>

                        <table>

                            <thead>

                                <tr>
                                    <th>Gbr</th>
                                    <th>Nama</th>
                                    <th>Kategori</th>
                                    <th>Harga</th>
                                    <th>Aksi</th>
                                </tr>

                            </thead>

                            <tbody id="menuBody"></tbody>

                        </table>

                    </div>

                </div>


                <!-- ==================== STOK ==================== -->
                <div
                    id="page-stok"
                    style="display:none;"
                >

                    <div class="panel">

                        <h3 id="stokFormTitle">
                            Tambah Barang Baru
                        </h3>

                        <div class="form-row">

                            <div class="field">

                                <label>
                                    Nama Barang
                                </label>

                                <input
                                    id="iName"
                                    placeholder="Cabe / Gas Elpiji / Es Batu"
                                >

                            </div>


                            <div class="field">

                                <label>
                                    Satuan
                                </label>

                                <input
                                    id="iUnit"
                                    placeholder="kg / tabung / liter / pcs"
                                >

                            </div>


                            <div class="field">

                                <label>
                                    Stok Awal
                                </label>

                                <input
                                    id="iStock"
                                    type="number"
                                    placeholder="0"
                                >

                            </div>


                            <button
                                class="btn btn-primary"
                                id="iSaveBtn"
                                onclick="saveInventoryItem()"
                            >
                                Simpan
                            </button>

                        </div>

                    </div>


                    <div class="panel">

                        <h3 id="stokListTitle">
                            Daftar & Status Stok
                        </h3>

                        <table>

                            <thead>

                                <tr>
                                    <th>Nama Barang</th>
                                    <th>Stok</th>
                                    <th>Satuan</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>

                            </thead>

                            <tbody id="stokStatusBody"></tbody>

                        </table>

                    </div>


                    <div class="panel">

                        <h3>
                            Riwayat Stok
                        </h3>

                        <table>

                            <thead>

                                <tr>
                                    <th>Tanggal</th>
                                    <th>Barang</th>
                                    <th>Jenis</th>
                                    <th>Jumlah</th>
                                    <th>Satuan</th>
                                    <th>Catatan</th>
                                </tr>

                            </thead>

                            <tbody id="stokLogBody"></tbody>

                        </table>

                    </div>

                </div>


                <!-- ==================== KASIR ==================== -->
                <div
                    id="page-kasir"
                    style="display:none;"
                >

                    <div class="pos-layout">

                        <div class="pos-products panel">

                            <h3>
                                Pesanan Pelanggan — Pilih Menu
                            </h3>

                            <div class="pos-toolbar">

                                <input
                                    id="posSearch"
                                    class="pos-search"
                                    placeholder="Cari menu..."
                                    oninput="renderPOS()"
                                >

                                <button
                                    class="btn btn-outline btn-compact"
                                    onclick="openMenuQr()"
                                >
                                    QR Menu
                                </button>

                            </div>


                            <div
                                class="cat-tabs"
                                id="posCatTabs"
                            ></div>


                            <div
                                class="prod-grid"
                                id="posProductGrid"
                            ></div>

                        </div>


                        <div class="pos-cart panel">

                            <h3>
                                Pesanan Saat Ini
                            </h3>


                            <div
                                class="paymethods"
                                id="orderTypeToggle"
                                style="margin-bottom:12px;"
                            >

                                <button
                                    data-t="dine-in"
                                    onclick="selectOrderType('dine-in')"
                                >
                                    Makan di Tempat
                                </button>

                                <button
                                    data-t="takeaway"
                                    onclick="selectOrderType('takeaway')"
                                >
                                    Bawa Pulang
                                </button>

                            </div>


                            <div class="field">

                                <label>
                                    Nama Pelanggan (opsional)
                                </label>

                                <input
                                    id="custName"
                                    placeholder="mis. Bu Rina"
                                >

                            </div>


                            <div id="cartBody">

                                <div class="empty">
                                    Belum ada item
                                </div>

                            </div>


                            <div
                                class="form-row"
                                style="margin-bottom:8px;"
                            >

                                <div class="field">

                                    <label>
                                        Diskon (Rp)
                                    </label>

                                    <input
                                        id="discountInput"
                                        type="number"
                                        placeholder="0"
                                    >

                                </div>


                                <button
                                    class="btn btn-outline"
                                    onclick="applyDiscount()"
                                >
                                    Terapkan
                                </button>

                            </div>


                            <div class="rline-mini">

                                <span>
                                    Subtotal
                                </span>

                                <span id="cartSubtotal">
                                    Rp 0
                                </span>

                            </div>


                            <div
                                class="rline-mini"
                                id="cartDiscountRow"
                                style="display:none;"
                            >

                                <span>
                                    Diskon
                                </span>

                                <span id="cartDiscount">
                                    - Rp 0
                                </span>

                            </div>


                            <div class="rline-mini">

                                <span>
                                    Pajak PB1 (10%)
                                </span>

                                <span id="cartTax">
                                    Rp 0
                                </span>

                            </div>


                            <div class="total-row">

                                <span>
                                    Total
                                </span>

                                <span id="cartTotal">
                                    Rp 0
                                </span>

                            </div>


                            <button
                                class="btn btn-accent"
                                style="width:100%"
                                onclick="openPaymentModal()"
                            >
                                Bayar
                            </button>

                        </div>

                    </div>

                </div>


                <!-- ==================== QR MENU ==================== -->
                <div
                    id="menuQrModal"
                    class="modal-overlay"
                    style="display:none;"
                >

                    <div
                        class="modal-box"
                        style="text-align:center;"
                    >

                        <div
                            class="modal-close"
                            onclick="closeMenuQr()"
                        >
                            ✕
                        </div>

                        <h3 style="margin-top:0;">
                            QR Menu
                        </h3>

                        <div
                            style="font-size:13px;color:var(--muted);margin-bottom:12px;"
                        >
                            Scan untuk melihat daftar menu
                        </div>

                        <div id="menuQrBox"></div>

                        <pre
                            id="menuQrText"
                            class="menu-qr-text"
                        ></pre>

                        <button
                            class="btn btn-primary"
                            style="margin-top:14px;"
                            onclick="printMenuQr()"
                        >
                            Cetak QR Menu
                        </button>

                    </div>

                </div>


                <!-- ==================== PEMBAYARAN ==================== -->
                <div
                    id="paymentModal"
                    class="modal-overlay"
                    style="display:none;"
                >

                    <div class="modal-box">

                        <div
                            class="modal-close"
                            onclick="closePaymentModal()"
                        >
                            ✕
                        </div>


                        <div
                            style="text-align:center;color:var(--muted);font-size:13px;"
                        >
                            Total yang harus dibayar
                        </div>


                        <div
                            style="text-align:center;font-size:30px;font-weight:700;color:var(--brand);margin:4px 0 18px;"
                            id="payModalTotal"
                        >
                            Rp 0
                        </div>


                        <div
                            class="paymethod-grid"
                            id="payMethodGrid"
                        >

                            <div
                                class="paymethod-card"
                                data-m="tunai"
                                onclick="selectPayModal('tunai')"
                            >

                                <div class="pm-ic">
                                    💵
                                </div>

                                <div>
                                    <b>Tunai</b>

                                    <div class="pm-sub">
                                        Uang kembali otomatis
                                    </div>
                                </div>

                            </div>


                            <div
                                class="paymethod-card"
                                data-m="qris"
                                onclick="selectPayModal('qris')"
                            >

                                <div class="pm-ic">
                                    📱
                                </div>

                                <div>
                                    <b>QRIS</b>

                                    <div class="pm-sub">
                                        Semua e-wallet & bank
                                    </div>
                                </div>

                            </div>


                            <div
                                class="paymethod-card"
                                data-m="kartu"
                                onclick="selectPayModal('kartu')"
                            >

                                <div class="pm-ic">
                                    💳
                                </div>

                                <div>
                                    <b>Kartu Debit/Kredit</b>

                                    <div class="pm-sub">
                                        Mesin EDC
                                    </div>
                                </div>

                            </div>


                            <div
                                class="paymethod-card"
                                data-m="transfer"
                                onclick="selectPayModal('transfer')"
                            >

                                <div class="pm-ic">
                                    🏦
                                </div>

                                <div>
                                    <b>Transfer Bank</b>

                                    <div class="pm-sub">
                                        BCA · Mandiri · BRI
                                    </div>
                                </div>

                            </div>

                        </div>


                        <div
                            id="cashSection"
                            style="display:none;"
                        >

                            <div class="field">

                                <label>
                                    Uang Diterima
                                </label>

                                <input
                                    id="cashReceived"
                                    type="number"
                                    oninput="updateChange()"
                                    placeholder="0"
                                >

                            </div>


                            <div class="quick-amt-row">

                                <button onclick="setQuickAmt('exact')">
                                    Uang pas
                                </button>

                                <button onclick="setQuickAmt(50000)">
                                    Rp 50.000
                                </button>

                                <button onclick="setQuickAmt(100000)">
                                    Rp 100.000
                                </button>

                                <button onclick="setQuickAmt(150000)">
                                    Rp 150.000
                                </button>

                                <button onclick="setQuickAmt(200000)">
                                    Rp 200.000
                                </button>

                            </div>


                            <div class="change-box">

                                <span>
                                    Kembalian
                                </span>

                                <b id="changeAmt">
                                    Rp 0
                                </b>

                            </div>

                        </div>


                        <button
                            class="btn btn-primary"
                            style="width:100%;margin-top:16px;"
                            onclick="confirmPayment()"
                        >
                            Konfirmasi & Cetak Struk
                        </button>

                    </div>

                </div>


                <!-- ==================== STRUK ==================== -->
                <div
                    id="receiptModal"
                    class="modal-overlay"
                    style="display:none;"
                >

                    <div class="modal-box">

                        <div
                            class="modal-close"
                            onclick="closeReceiptModal()"
                        >
                            ✕
                        </div>

                        <h3 style="margin-top:0;">
                            Pembayaran berhasil
                        </h3>

                        <div
                            class="receipt-onscreen"
                            id="receiptModalBody"
                        ></div>

                        <div
                            id="fakeQr"
                            style="text-align:center;margin:14px 0;"
                        ></div>

                        <div
                            class="form-row"
                            style="margin-top:10px;"
                        >

                            <button
                                class="btn btn-outline"
                                style="flex:1;"
                                onclick="sendWhatsApp()"
                            >
                                Kirim via WhatsApp
                            </button>

                            <button
                                class="btn btn-primary"
                                style="flex:1;"
                                onclick="printLastReceipt()"
                            >
                                Cetak Struk
                            </button>

                        </div>

                        <button
                            class="btn btn-outline"
                            style="width:100%;margin-top:8px;"
                            onclick="closeReceiptModal()"
                        >
                            Transaksi Baru
                        </button>

                    </div>

                </div>


                <!-- ==================== LAPORAN ==================== -->
                <div
                    id="page-laporan"
                    style="display:none;"
                >

                    <div id="reportAnalyticsSection">

                        <div class="grid">

                            <div class="stat-card">

                                <div class="lbl">
                                    Penjualan Hari Ini
                                </div>

                                <div
                                    class="num"
                                    id="repTodaySales"
                                >
                                    Rp 0
                                </div>

                                <div
                                    class="delta"
                                    id="repTodayDelta"
                                >
                                    –
                                </div>

                            </div>


                            <div class="stat-card">

                                <div class="lbl">
                                    Jumlah Transaksi
                                </div>

                                <div
                                    class="num"
                                    id="repTodayCount"
                                >
                                    0
                                </div>

                                <div
                                    class="delta"
                                    id="repCountDelta"
                                >
                                    –
                                </div>

                            </div>


                            <div class="stat-card">

                                <div class="lbl">
                                    Rata-rata per Struk
                                </div>

                                <div
                                    class="num"
                                    id="repAvgTrx"
                                >
                                    Rp 0
                                </div>

                                <div
                                    class="delta"
                                    id="repAvgDelta"
                                >
                                    –
                                </div>

                            </div>


                            <div class="stat-card">

                                <div class="lbl">
                                    Pajak Terkumpul Hari Ini
                                </div>

                                <div
                                    class="num"
                                    id="repTodayTax"
                                >
                                    Rp 0
                                </div>

                                <div
                                    class="delta"
                                    style="color:var(--muted)"
                                >
                                    PB1 10%
                                </div>

                            </div>

                        </div>


                        <div
                            class="pos-layout"
                            style="margin-bottom:18px;"
                        >

                            <div
                                class="panel"
                                style="flex:2;min-width:280px;"
                            >

                                <h3>
                                    Penjualan 7 Hari Terakhir
                                </h3>

                                <div
                                    class="bar-chart"
                                    id="weeklyBarChart"
                                ></div>

                            </div>


                            <div
                                class="panel"
                                style="flex:1;min-width:240px;"
                            >

                                <h3>
                                    Metode Pembayaran
                                </h3>

                                <div class="donut-wrap">

                                    <div
                                        class="donut"
                                        id="paymentDonut"
                                    ></div>

                                    <div
                                        id="paymentLegend"
                                    ></div>

                                </div>

                            </div>

                        </div>


                        <div
                            class="pos-layout"
                            style="margin-bottom:18px;"
                        >

                            <div
                                class="panel"
                                style="flex:1;min-width:260px;"
                            >

                                <h3>
                                    Menu Terlaris Bulan Ini
                                </h3>

                                <table>

                                    <thead>

                                        <tr>
                                            <th>Menu</th>
                                            <th>Porsi</th>
                                            <th>Omzet</th>
                                        </tr>

                                    </thead>

                                    <tbody id="topMenuBody"></tbody>

                                </table>

                            </div>


                            <div
                                class="panel"
                                style="flex:1;min-width:260px;"
                            >

                                <h3>
                                    Jam Tersibuk
                                </h3>

                                <table>

                                    <thead>

                                        <tr>
                                            <th>Rentang Jam</th>
                                            <th>Transaksi</th>
                                            <th>Omzet</th>
                                        </tr>

                                    </thead>

                                    <tbody id="topHoursBody"></tbody>

                                </table>

                            </div>

                        </div>

                    </div>


                    <div class="panel">

                        <div class="filter-row">

                            <div class="field">

                                <label>
                                    Dari Tanggal
                                </label>

                                <input
                                    type="date"
                                    id="repFrom"
                                >

                            </div>


                            <div class="field">

                                <label>
                                    Sampai Tanggal
                                </label>

                                <input
                                    type="date"
                                    id="repTo"
                                >

                            </div>


                            <div
                                class="field"
                                style="flex:0 0 auto;"
                            >

                                <label>
                                    &nbsp;
                                </label>

                                <button
                                    class="btn btn-outline btn-compact"
                                    onclick="renderReport()"
                                >
                                    Terapkan Filter
                                </button>

                            </div>


                            <div
                                class="field"
                                style="flex:0 0 auto;"
                            >

                                <label>
                                    &nbsp;
                                </label>

                                <button
                                    class="btn btn-primary btn-compact"
                                    onclick="window.print()"
                                >
                                    Unduh / Cetak PDF
                                </button>

                            </div>

                        </div>


                        <div class="grid">

                            <div class="stat-card">

                                <div
                                    class="num"
                                    id="repTotalSales"
                                >
                                    Rp 0
                                </div>

                                <div class="lbl">
                                    Total Penjualan
                                </div>

                            </div>


                            <div class="stat-card">

                                <div
                                    class="num"
                                    id="repTotalTrx"
                                >
                                    0
                                </div>

                                <div class="lbl">
                                    Jumlah Transaksi
                                </div>

                            </div>

                        </div>


                        <h3 class="section-title">
                            Metode Pembayaran
                        </h3>

                        <table>

                            <thead>

                                <tr>
                                    <th>Metode</th>
                                    <th>Jumlah Transaksi</th>
                                    <th>Total</th>
                                </tr>

                            </thead>

                            <tbody id="repPayBody"></tbody>

                        </table>


                        <h3 class="section-title">
                            Riwayat Transaksi
                        </h3>

                        <table>

                            <thead>

                                <tr>
                                    <th>Tanggal</th>
                                    <th>Item</th>
                                    <th>Bayar</th>
                                    <th>Total</th>
                                </tr>

                            </thead>

                            <tbody id="repBody"></tbody>

                        </table>

                    </div>

                </div>


                <!-- ==================== PROFIL ==================== -->
                <div
                    id="page-profil"
                    style="display:none;"
                >

                    <div
                        class="panel"
                        style="max-width:400px;"
                    >

                        <h3>
                            Profil Saya
                        </h3>


                        <div class="field">

                            <label>
                                Nama
                            </label>

                            <input id="myName">

                        </div>


                        <div class="field">

                            <label>
                                Username
                            </label>

                            <input id="myUser">

                        </div>


                        <div class="field">

                            <label>
                                Password Baru (opsional)
                            </label>

                            <input
                                id="myPass"
                                type="text"
                                placeholder="Biarkan kosong jika tidak diubah"
                            >

                        </div>


                        <button
                            class="btn btn-primary"
                            onclick="saveProfile()"
                        >
                            Simpan Perubahan
                        </button>


                        <div
                            class="error-msg"
                            id="profileMsg"
                            style="color:var(--brand)"
                        ></div>

                    </div>

                </div>

            </div>

        </div>

    </div>


    <!-- PRINT STRUK -->
    <div id="receiptPrint"></div>


    <!-- JAVASCRIPT -->
    <script src="{{ asset('js/app.js') }}"></script>

</body>
</html>