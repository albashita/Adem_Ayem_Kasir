<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Struk {{ $order->invoice_number }} - Adem Ayem</title>
<style>
  :root{--brand:#2F7D50;--ink:#1E2420;--muted:#68706A;--line:#D4DDD6;--bg:#EDF2EE;}
  *{box-sizing:border-box;}
  body{margin:0;padding:20px 14px;background:var(--bg);color:var(--ink);font-family:'Segoe UI',Roboto,Arial,sans-serif;}
  .card{max-width:380px;margin:0 auto;background:#fff;border:1px solid var(--line);border-top:3px solid #5A3E2B;border-radius:8px;padding:22px 20px;}
  h1{margin:0;text-align:center;font-size:20px;color:var(--brand);}
  .sub{text-align:center;color:var(--muted);font-size:12px;margin:2px 0 14px;}
  .row{display:flex;justify-content:space-between;gap:12px;font-size:13.5px;padding:3px 0;}
  .row span:first-child{color:var(--muted);}
  hr{border:none;border-top:1px dashed var(--line);margin:12px 0;}
  .item{display:flex;justify-content:space-between;gap:12px;font-size:14px;padding:4px 0;}
  .item small{display:block;color:var(--muted);}
  .total{font-weight:700;font-size:17px;color:var(--brand);}
  .total span:first-child{color:inherit;}
  .ok{display:block;text-align:center;margin:0 auto 14px;padding:4px 12px;width:max-content;background:#E5F6EB;color:#1E7E34;border:1px solid #BFE8CB;border-radius:20px;font-size:12px;font-weight:600;}
  .thanks{text-align:center;color:var(--muted);font-size:12.5px;margin-top:14px;}
</style>
</head>
<body>
@php
  $methods = ['cash' => 'Tunai', 'qris' => 'QRIS', 'transfer' => 'Transfer Bank'];
@endphp
<div class="card">
  <h1>Adem Ayem</h1>
  <div class="sub">Struk Pembayaran Digital</div>
  <span class="ok">Pembayaran Berhasil</span>

  <div class="row"><span>No. Invoice</span><b>{{ $order->invoice_number }}</b></div>
  <div class="row"><span>Tanggal</span><span>{{ \Carbon\Carbon::parse($order->order_date)->translatedFormat('d M Y, H:i') }}</span></div>
  <div class="row"><span>Pelanggan</span><span>{{ $order->customer_name ?: 'Umum' }}</span></div>
  <div class="row"><span>Tipe</span><span>{{ $order->service_type === 'takeaway' ? 'Bawa Pulang' : 'Makan di Tempat' }}</span></div>
  <hr>

  @foreach ($order->items as $item)
    <div class="item">
      <div>{{ $item->menu->name ?? '-' }}<small>{{ $item->quantity }} x Rp {{ number_format($item->price, 0, ',', '.') }}</small></div>
      <div>Rp {{ number_format($item->price * $item->quantity, 0, ',', '.') }}</div>
    </div>
  @endforeach
  <hr>

  <div class="row"><span>Subtotal</span><span>Rp {{ number_format($order->subtotal, 0, ',', '.') }}</span></div>
  @if ($order->discount > 0)
    <div class="row"><span>Diskon</span><span>- Rp {{ number_format($order->discount, 0, ',', '.') }}</span></div>
  @endif
  <div class="row total"><span>Total</span><span>Rp {{ number_format($order->total, 0, ',', '.') }}</span></div>
  <div class="row"><span>Metode</span><span>{{ $methods[$order->payment?->payment_method] ?? '-' }}</span></div>

  <div class="thanks">Terima kasih atas kunjungan Anda</div>
</div>
</body>
</html>