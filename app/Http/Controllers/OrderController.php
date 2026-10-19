<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\Order;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    private const TAX_RATE = 0.10;

    public function store(Request $request)
    {
        $data = $request->validate([
            'customer_name'    => 'nullable|string|max:30',
            'service_type'     => 'required|in:dine-in,takeaway',
            'discount'         => 'nullable|integer|min:0',
            'items'            => 'required|array|min:1',
            'items.*.menu_id'  => 'required|integer|exists:menus,id_menu',
            'items.*.qty'      => 'required|integer|min:1|max:99',
        ]);

        $order = DB::transaction(function () use ($data) {
            $menus = Menu::with('category')
                ->whereIn('id_menu', collect($data['items'])->pluck('menu_id'))
                ->get()
                ->keyBy('id_menu');

            $subtotal = 0;
            $rows = [];
            foreach ($data['items'] as $item) {
                $menu = $menus[$item['menu_id']];
                $line = $menu->price * $item['qty'];
                $subtotal += $line;
                $rows[] = [
                    'quantity'      => $item['qty'],
                    'price'         => $menu->price,
                    'subtotal'      => $line,
                    'menus_id_menu' => $menu->id_menu,
                ];
            }

            $discount = min((int) ($data['discount'] ?? 0), $subtotal);
            $tax      = (int) round($subtotal * self::TAX_RATE);
            $total    = $subtotal - $discount + $tax;

            $allDrinks = $menus->every(fn ($m) => strtolower($m->category->name ?? '') === 'minuman');

            $today = now()->format('Ymd');
            $seq   = Order::whereDate('order_date', now()->toDateString())->lockForUpdate()->count() + 1;

            $order = Order::create([
                'invoice_number' => 'INV-' . $today . '-' . str_pad($seq, 4, '0', STR_PAD_LEFT),
                'order_date'     => now(),
                'subtotal'       => $subtotal,
                'discount'       => $discount,
                'tax'            => $tax,
                'total'          => $total,
                'status'         => 'pending',
                'customer_name'  => $data['customer_name'] ?: 'Umum',
                'order_type'     => $allDrinks ? 'minuman' : 'makanan',
                'service_type'   => $data['service_type'],
                'users_id_user'  => Auth::id(),
            ]);

            $order->items()->createMany($rows);

            return $order;
        });

        return response()->json([
            'message'  => 'Pesanan tersimpan.',
            'order_no' => $order->invoice_number,
            'id'       => $order->id_order,
        ], 201);
    }

    public function history()
    {
        $orders = Order::with(['items.menu', 'payment'])
            ->orderByDesc('order_date')
            ->limit(200)
            ->get();

        return response()->json($orders->map(fn ($o) => [
            'id'             => $o->id_order,
            'no'             => $o->invoice_number,
            'date'           => Carbon::parse($o->order_date)->toIso8601String(),
            'customer'       => $o->customer_name,
            'service_type'   => $o->service_type,
            'subtotal'       => $o->subtotal,
            'discount'       => $o->discount,
            'tax'            => $o->tax,
            'total'          => $o->total,
            'status'         => $o->status,
            'payment_method' => $o->payment?->payment_method,
            'items'          => $o->items->map(fn ($i) => [
                'name'  => $i->menu->name ?? '-',
                'qty'   => $i->quantity,
                'price' => $i->price,
            ])->values(),
        ])->values());
    }

    public function pay(Request $request, $id)
    {
        $data = $request->validate([
            'payment_method'   => 'required|in:cash,transfer,qris',
            'received'         => 'nullable|integer|min:0',
            'reference_number' => 'nullable|string|max:50',
        ]);

        $result = DB::transaction(function () use ($id, $data) {
            $order = Order::lockForUpdate()->findOrFail($id);

            if ($order->status !== 'pending') {
                return 'sudah';
            }
            if ($data['payment_method'] === 'cash' && (int) ($data['received'] ?? 0) < $order->total) {
                return 'kurang';
            }

            Payment::create([
                'payment_method'   => $data['payment_method'],
                'amount'           => $order->total,
                'paid_at'          => now(),
                'reference_number' => $data['reference_number'] ?? null,
                'orders_id_order'  => $order->id_order,
            ]);
            $order->update(['status' => 'completed']);

            return 'ok';
        });

        if ($result === 'sudah') {
            return response()->json(['message' => 'Pesanan ini sudah dibayar atau dibatalkan.'], 422);
        }
        if ($result === 'kurang') {
            return response()->json(['message' => 'Uang diterima kurang dari total.'], 422);
        }

        return response()->json(['message' => 'Pembayaran berhasil.']);
    }
}