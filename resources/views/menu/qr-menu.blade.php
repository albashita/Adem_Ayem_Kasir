<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Menu - Adem Ayem</title>
    <link rel="stylesheet" href="{{ asset('css/qr-menu.css') }}">
</head>
<body class="qrmenu-body">

<header class="qrmenu-header">
    <h1>Adem Ayem</h1>
    <p>Daftar Menu</p>
</header>

<nav class="qrmenu-tabs">
    <a href="#" class="active" data-cat="all">Semua</a>
    @foreach ($categories as $cat)
        <a href="#" data-cat="{{ $cat->id_categorie }}">{{ $cat->name }}</a>
    @endforeach
</nav>

<main class="qrmenu-list">
    @foreach ($categories as $cat)
        @if ($cat->menus->count())
        <section class="qrmenu-section" data-cat="{{ $cat->id_categorie }}">
            <h2>{{ $cat->name }}</h2>

            @foreach ($cat->menus as $menu)
            <article class="qrmenu-item">
                @if ($menu->image)
                    <img src="{{ asset('storage/' . $menu->image) }}" alt="{{ $menu->name }}">
                @else
                    <div class="qrmenu-noimg">{{ strtoupper(substr($menu->name, 0, 1)) }}</div>
                @endif

                <div class="qrmenu-info">
                    <h3>{{ $menu->name }}</h3>
                    @if ($menu->description)
                        <p>{{ $menu->description }}</p>
                    @endif
                    <strong>Rp {{ number_format($menu->price, 0, ',', '.') }}</strong>
                </div>
            </article>
            @endforeach
        </section>
        @endif
    @endforeach
</main>

<script>
document.querySelectorAll('.qrmenu-tabs a').forEach(tab => {
    tab.addEventListener('click', e => {
        e.preventDefault();
        const cat = tab.dataset.cat;
        document.querySelectorAll('.qrmenu-tabs a').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.qrmenu-section').forEach(s => {
            s.style.display = (cat === 'all' || s.dataset.cat === cat) ? '' : 'none';
        });
    });
});
</script>
</body>
</html>