<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RiwayatController extends Controller
{
    public function index()
    {
        return view('riwayat.index');
    }

    public function data()
    {
        $orders = Order::with(['items.menu', 'payment', 'user'])
            ->orderByDesc('order_date')
            ->limit(200)
            ->get();

        return response()->json($orders->map(fn ($o) => [
            'id'             => $o->id_order,
            'no'             => $o->invoice_number,
            'date'           => Carbon::parse($o->order_date)->toIso8601String(),
            'customer'       => $o->customer_name,
            'service_type'   => $o->service_type,
            'status'         => $o->status,
            'payment_method' => $o->payment?->payment_method,
            'subtotal'       => (int) $o->subtotal,
            'discount'       => (int) $o->discount,
            'tax'            => (int) $o->tax,
            'total'          => (int) $o->total,
            'amount_paid'    => $o->payment?->amount,
            'paid_at'        => $o->payment?->paid_at ? Carbon::parse($o->payment->paid_at)->toIso8601String() : null,
            'receipt_url'    => $o->receipt_token ? rtrim(config('app.url'), '/') . route('receipt.show', $o->receipt_token, false) : null,
            'items'          => $o->items->map(fn ($i) => [
                'name'  => $i->menu->name ?? '-',
                'price' => (int) $i->price,
                'qty'   => (int) $i->quantity,
            ])->values(),
        ])->values());
    }

    public function pay(Request $request, Order $order)
    {
        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Pesanan ini sudah diproses.'], 422);
        }

        $data = $request->validate([
            'payment_method' => 'required|in:cash,qris,transfer',
            'received'       => 'nullable|numeric|min:0',
        ]);

        $received = null;
        $change   = 0;

        if ($data['payment_method'] === 'cash') {
            $received = (int) ($data['received'] ?? 0);
            if ($received < $order->total) {
                return response()->json(['message' => 'Uang diterima kurang dari total.'], 422);
            }
            $change = $received - $order->total;
        }

        Payment::create([
            'payment_method'  => $data['payment_method'],
            'amount'          => $order->total,
            'paid_at'         => now(),
            'orders_id_order' => $order->id_order,
        ]);

        $orderUpdates = ['status' => 'completed'];
        if (! $order->receipt_token) {
            $orderUpdates['receipt_token'] = Str::random(16);
        }
        $order->update($orderUpdates);

        return response()->json(['message' => 'Pembayaran berhasil.', 'change' => $change]);
    }
}
