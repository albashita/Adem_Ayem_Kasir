<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\Order;
use App\Models\Payment;
use App\Models\StockItem;
use App\Models\StockMovement;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    private const TAX_RATE = 0.10;

    /**
     * Simpan pesanan baru dari kasir dengan status pending.
     * Termasuk validasi ketersediaan stok bahan baku di awal.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'customer_name' => 'nullable|string|max:30',
            'service_type' => 'required|in:dine-in,takeaway',
            'discount' => 'nullable|integer|min:0',
            'items' => 'required|array|min:1',
            'items.*.menu_id' => 'required|integer|exists:menus,id_menu',
            'items.*.qty' => 'required|integer|min:1|max:99',
        ]);

        // Muat menu beserta relasi ingredients dan stockItem
        $menuIds = collect($data['items'])->pluck('menu_id');
        $menus = Menu::with(['category', 'ingredients.stockItem'])
            ->whereIn('id_menu', $menuIds)
            ->get()
            ->keyBy('id_menu');

        // Akumulasikan kebutuhan bahan baku untuk seluruh item dalam transaksi
        $stockRequirements = [];
        foreach ($data['items'] as $item) {
            $menu = $menus->get($item['menu_id']);
            if (! $menu || $menu->ingredients->isEmpty()) {
                continue;
            }

            foreach ($menu->ingredients as $ingredient) {
                $stockId = $ingredient->stock_items_id_stock_item;
                $needed = (float) $ingredient->quantity_required * (int) $item['qty'];

                if (! isset($stockRequirements[$stockId])) {
                    $stockRequirements[$stockId] = [
                        'name' => $ingredient->stockItem?->name ?? "Bahan #{$stockId}",
                        'unit' => $ingredient->stockItem?->unit ?? '',
                        'current_stock' => (float) ($ingredient->stockItem?->current_stock ?? 0),
                        'needed' => 0.0,
                    ];
                }
                $stockRequirements[$stockId]['needed'] += $needed;
            }
        }

        // Validasi ketersediaan stok di backend sebelum pesanan dibuat
        foreach ($stockRequirements as $stockId => $info) {
            if ($info['current_stock'] < $info['needed']) {
                return response()->json([
                    'message' => "Stok bahan baku '{$info['name']}' tidak mencukupi untuk pesanan ini. Tersedia: {$info['current_stock']} {$info['unit']}, dibutuhkan: {$info['needed']} {$info['unit']}.",
                ], 422);
            }
        }

        $order = DB::transaction(function () use ($data, $menus) {
            $subtotal = 0;
            $rows = [];
            foreach ($data['items'] as $item) {
                $menu = $menus[$item['menu_id']];
                $line = $menu->price * $item['qty'];
                $subtotal += $line;
                $rows[] = [
                    'quantity' => $item['qty'],
                    'price' => $menu->price,
                    'subtotal' => $line,
                    'menus_id_menu' => $menu->id_menu,
                ];
            }

            $discount = min((int) ($data['discount'] ?? 0), $subtotal);
            $tax = (int) round($subtotal * self::TAX_RATE);
            $total = $subtotal - $discount + $tax;

            $allDrinks = $menus->every(fn ($m) => strtolower($m->category->name ?? '') === 'minuman');

            $today = now()->format('Ymd');
            $seq = Order::whereDate('order_date', now()->toDateString())->lockForUpdate()->count() + 1;

            $order = Order::create([
                'invoice_number' => 'INV-'.$today.'-'.str_pad($seq, 4, '0', STR_PAD_LEFT),
                'order_date' => now(),
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $tax,
                'total' => $total,
                'status' => 'pending',
                'customer_name' => $data['customer_name'] ?: 'Umum',
                'order_type' => $allDrinks ? 'minuman' : 'makanan',
                'service_type' => $data['service_type'],
                'users_id_user' => Auth::id(),
            ]);

            $order->items()->createMany($rows);

            return $order;
        });

        return response()->json([
            'message' => 'Pesanan tersimpan.',
            'order_no' => $order->invoice_number,
            'invoice_number' => $order->invoice_number,
            'id' => $order->id_order,
        ], 201);
    }

    /**
     * Riwayat transaksi untuk kasir dan pemilik.
     */
    public function history()
    {
        $orders = Order::with(['items.menu', 'payment'])
            ->orderByDesc('order_date')
            ->limit(200)
            ->get();

        return response()->json($orders->map(fn ($o) => [
            'id' => $o->id_order,
            'no' => $o->invoice_number,
            'date' => Carbon::parse($o->order_date)->toIso8601String(),
            'customer' => $o->customer_name,
            'service_type' => $o->service_type,
            'subtotal' => $o->subtotal,
            'discount' => $o->discount,
            'tax' => $o->tax,
            'total' => $o->total,
            'status' => $o->status,
            'payment_method' => $o->payment?->payment_method,
            'amount_paid' => $o->payment?->amount,
            'paid_at' => $o->payment?->paid_at ? Carbon::parse($o->payment->paid_at)->toIso8601String() : null,
            'items' => $o->items->map(fn ($i) => [
                'name' => $i->menu->name ?? '-',
                'qty' => $i->quantity,
                'price' => $i->price,
            ])->values(),
        ])->values());
    }

    /**
     * Konfirmasi pembayaran transaksi dan pengurangan stok bahan baku otomatis.
     * Pengurangan stok dilakukan atomic dalam database transaction dengan lockForUpdate.
     */
    public function pay(Request $request, $id)
    {
        $data = $request->validate([
            'payment_method' => 'required|in:cash,transfer,qris',
            'received' => 'nullable|integer|min:0',
            'reference_number' => 'nullable|string|max:50',
        ]);

        $result = DB::transaction(function () use ($id, $data) {
            // Lock order untuk mencegah update ganda saat concurrent request
            $order = Order::with(['items.menu.ingredients.stockItem'])
                ->lockForUpdate()
                ->findOrFail($id);

            // Cegah pembayaran ganda & pengurangan stok berulang
            if ($order->status !== 'pending') {
                return [
                    'status' => 'sudah',
                    'message' => 'Pesanan ini sudah dibayar atau dibatalkan.',
                ];
            }

            // Validasi nominal tunai
            if ($data['payment_method'] === 'cash' && (int) ($data['received'] ?? 0) < $order->total) {
                return [
                    'status' => 'kurang',
                    'message' => 'Uang diterima kurang dari total tagihan.',
                ];
            }

            // 1. Akumulasikan kebutuhan bahan baku dari seluruh item pesanan
            $stockRequirements = [];
            foreach ($order->items as $orderItem) {
                $menu = $orderItem->menu;
                // Jika menu tidak memiliki resep, jangan mengasumsikan bahan apapun
                if (! $menu || $menu->ingredients->isEmpty()) {
                    continue;
                }

                foreach ($menu->ingredients as $ingredient) {
                    $stockId = $ingredient->stock_items_id_stock_item;
                    $needed = (float) $ingredient->quantity_required * (int) $orderItem->quantity;

                    $stockRequirements[$stockId] = ($stockRequirements[$stockId] ?? 0.0) + $needed;
                }
            }

            // 2. Lock dan validasi stok bahan baku secara aman
            if (! empty($stockRequirements)) {
                $stockItems = StockItem::whereIn('id_stock_item', array_keys($stockRequirements))
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id_stock_item');

                // Cek ketersediaan untuk setiap bahan baku
                foreach ($stockRequirements as $stockId => $neededQty) {
                    $stockItem = $stockItems->get($stockId);
                    $avail = (float) ($stockItem?->current_stock ?? 0);

                    if (! $stockItem || $avail < $neededQty) {
                        $itemName = $stockItem ? $stockItem->name : "Bahan #{$stockId}";
                        $unit = $stockItem ? $stockItem->unit : '';

                        return [
                            'status' => 'stok_kurang',
                            'message' => "Stok bahan baku '{$itemName}' tidak mencukupi untuk menyelesaikan transaksi (tersedia: {$avail} {$unit}, dibutuhkan: {$neededQty} {$unit}).",
                        ];
                    }
                }

                // 3. Kurangi stok aktual dan catat riwayat pergerakan stok
                foreach ($stockRequirements as $stockId => $neededQty) {
                    $stockItem = $stockItems->get($stockId);
                    $deductQty = (int) ceil($neededQty);

                    $stockItem->decrement('current_stock', $deductQty);

                    StockMovement::create([
                        'type' => 'out',
                        'quantity' => $deductQty,
                        'source_type' => 'other',
                        'description' => "Penjualan: {$order->invoice_number}",
                        'users_id_user' => Auth::id() ?: $order->users_id_user,
                        'stock_items_id_stock_item' => $stockId,
                    ]);
                }
            }

            // 4. Catat pembayaran
            Payment::create([
                'payment_method' => $data['payment_method'],
                'amount' => $order->total,
                'paid_at' => now(),
                'reference_number' => $data['reference_number'] ?? null,
                'orders_id_order' => $order->id_order,
            ]);

            // 5. Ubah status pesanan menjadi completed
            $order->update(['status' => 'completed']);

            return [
                'status' => 'ok',
                'message' => 'Pembayaran berhasil.',
            ];
        });

        if ($result['status'] !== 'ok') {
            return response()->json(['message' => $result['message']], 422);
        }

        return response()->json(['message' => $result['message']]);
    }
}
