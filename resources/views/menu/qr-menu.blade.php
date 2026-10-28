<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Daftar Menu - Depot Yu Sri Adem Ayem</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Kaushan+Script&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('css/qr-menu.css') }}">
</head>
<body>
    <header class="menu-header">
        <p class="depot">Depot Yu Sri</p>
        <p class="brand">Adem Ayem</p>
        <h1>Daftar Menu</h1>
    </header>

    <main class="menu-container">
        <div class="menu-filters">
            <input
                type="search"
                id="menuSearch"
                placeholder="Cari nama menu..."
                aria-label="Cari menu"
            >
            <div class="category-chips" id="categoryChips" role="group" aria-label="Pilih kategori"></div>
        </div>

        <p id="menuStatus" class="menu-status">Memuat menu...</p>
        <section id="menuList" class="menu-grid"></section>
    </main>

    <footer class="menu-footer">
        Terima kasih telah berkunjung ke Depot Yu Sri Adem Ayem.
    </footer>

    <script>
        const menuList = document.getElementById('menuList');
        const menuStatus = document.getElementById('menuStatus');
        const menuSearch = document.getElementById('menuSearch');
        const categoryChips = document.getElementById('categoryChips');

        let menus = [];
        let selectedCategory = '';

        function escapeHTML(value) {
            return String(value ?? '').replace(/[&<>"']/g, char => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            })[char]);
        }

        function renderChips(categories) {
            const items = [{ value: '', label: 'Semua' },
                ...categories.map(name => ({ value: name, label: name }))];

            categoryChips.innerHTML = items.map(item => `
                <button type="button"
                        class="chip ${item.value === selectedCategory ? 'active' : ''}"
                        data-value="${escapeHTML(item.value)}"
                        aria-pressed="${item.value === selectedCategory}">
                    ${escapeHTML(item.label)}
                </button>
            `).join('');
        }

        function renderMenus() {
            const keyword = menuSearch.value.trim().toLowerCase();

            const filtered = menus.filter(menu => {
                const name = String(menu.name || '').toLowerCase();
                const category = String(menu.category?.name || '');

                return name.includes(keyword) &&
                    (!selectedCategory || category === selectedCategory);
            });

            if (!filtered.length) {
                menuList.innerHTML = '';
                menuStatus.hidden = false;
                menuStatus.textContent = menus.length
                    ? 'Menu yang dicari tidak ditemukan.'
                    : 'Belum ada menu yang tersedia.';
                return;
            }

            menuStatus.hidden = true;

            menuList.innerHTML = filtered.map(menu => {
                const photo = menu.image_url
                    ? `<img src="${escapeHTML(menu.image_url)}"
                            alt="${escapeHTML(menu.name)}"
                            loading="lazy"
                            onerror="this.style.display='none';">`
                    : '<div class="no-photo">Foto belum tersedia</div>';

                const price = new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    maximumFractionDigits: 0
                }).format(Number(menu.price) || 0);

                return `
                    <article class="menu-card">
                        <div class="menu-photo">${photo}</div>
                        <div class="menu-info">
                            <h2>${escapeHTML(menu.name)}</h2>
                            <p>${escapeHTML(menu.description || 'Menu pilihan Adem Ayem.')}</p>
                            <strong>${price}</strong>
                        </div>
                    </article>
                `;
            }).join('');
        }

        async function loadMenus() {
            try {
                const response = await fetch('/qr-menu/data', {
                    headers: { 'Accept': 'application/json' }
                });

                if (!response.ok) {
                    throw new Error('Gagal mengambil data menu.');
                }

                menus = await response.json();

                const categories = [
                    ...new Set(menus.map(menu => menu.category?.name).filter(Boolean))
                ];

                renderChips(categories);
                renderMenus();
            } catch (error) {
                menuStatus.hidden = false;
                menuStatus.textContent = 'Menu gagal dimuat. Silakan muat ulang halaman.';
                console.error(error);
            }
        }

        categoryChips.addEventListener('click', event => {
            const chip = event.target.closest('.chip');
            if (!chip) return;

            selectedCategory = chip.dataset.value;

            categoryChips.querySelectorAll('.chip').forEach(button => {
                const active = button.dataset.value === selectedCategory;
                button.classList.toggle('active', active);
                button.setAttribute('aria-pressed', String(active));
            });

            renderMenus();
        });

        menuSearch.addEventListener('input', renderMenus);

        loadMenus();
    </script>
</body>
</html>